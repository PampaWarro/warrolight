import numpy as np
import scipy.signal
import logging
np.seterr(divide='ignore', invalid='ignore')

logger = logging.getLogger(__name__)


class ExpDecayFollower:
    def __init__(self, alpha):
        self.alpha = alpha
        self.value = self.max = self.avg = self.min = None
        self.normalized_value = 0
        self.normalized_avg = 0

    def update(self, new_value):
        self.value = new_value
        if self.avg is None:
            self.max = self.avg = self.min = new_value
            return
        for attr in ('max', 'avg', 'min'):
            value = getattr(self, attr)
            value = value * (1.0 - self.alpha)
            value = value + (new_value * self.alpha)
            setattr(self, attr, value)
        self.max = np.maximum(self.max, new_value)
        self.min = np.minimum(self.min, new_value)
        divisor = self.max - self.min
        self.normalized_value = self._safe_div(self.value - self.min, divisor)
        self.normalized_avg = self._safe_div(self.avg - self.min, divisor)

    def _safe_div(self, value, divisor):
        value = np.divide(value, divisor)
        return value

    def as_dict(self):
        return {
            'max': self.max,
            'avg': self.avg,
            'min': self.min,
            'normalized_value': self.normalized_value,
            'normalized_avg': self.normalized_avg,
        }


class BandPassFilter:
    def __init__(self, lowcut, highcut, fs, order=5):
        self._sos = scipy.signal.butter(order, [lowcut, highcut],
                                        fs=fs,
                                        btype='bandpass',
                                        output='sos')
        self._zi = scipy.signal.sosfilt_zi(self._sos)

    def __call__(self, samples):
        filtered, self._zi = scipy.signal.sosfilt(self._sos,
                                                  samples,
                                                  zi=self._zi)
        return filtered


def fft(frame):
    for channel in frame['channels']:
        samples = channel['samples']
        channel['fft'] = np.absolute(np.fft.rfft(samples))
    return frame


def rms(frame):
    for channel in frame['channels']:
        samples = channel['samples']
        channel['rms'] = np.sqrt(np.mean(samples**2))
        for _, band in channel['bands'].items():
            samples = band['samples']
            band['rms'] = np.sqrt(np.mean(samples**2))
    return frame


def peak(frame):
    for channel in frame['channels']:
        samples = channel['samples']
        channel['peak'] = np.max(np.absolute(samples))
        for _, band in channel['bands'].items():
            samples = band['samples']
            band['peak'] = np.max(np.absolute(samples))


class MovingStats:
    def __init__(self, values, fields, skip_bands=False):
        self._values = values
        self._fields = fields
        self._followers = {}
        self._skip_bands = skip_bands

    def _followers_for_channel(self, channel_index):
        try:
            return self._followers[channel_index]
        except KeyError:
            followers = {(name, field): ExpDecayFollower(*args)
                         for name, args in self._values.items()
                         for field in self._fields}
            self._followers[channel_index] = followers
            return followers

    def _followers_for_band(self, channel_index, band_name):
        key = (channel_index, band_name)
        try:
            return self._followers[key]
        except KeyError:
            followers = {(name, field): ExpDecayFollower(*args)
                         for name, args in self._values.items()
                         for field in self._fields}
            self._followers[key] = followers
            return followers

    def __call__(self, frame):
        for channel_index, channel in enumerate(frame['channels']):
            try:
                moving_stats = channel['moving_stats']
            except KeyError:
                moving_stats = channel['moving_stats'] = {}
            followers = self._followers_for_channel(channel_index)
            for ((name, field), follower) in followers.items():
                follower.update(channel[field])
                try:
                    field_stats = moving_stats[field]
                except KeyError:
                    field_stats = moving_stats[field] = {}
                field_stats[name] = follower.as_dict()
            if self._skip_bands:
                continue
            for band_name, band in channel['bands'].items():
                try:
                    moving_stats = band['moving_stats']
                except KeyError:
                    moving_stats = band['moving_stats'] = {}
                followers = self._followers_for_band(channel_index, band_name)
                for ((name, field), follower) in followers.items():
                    follower.update(band[field])
                    try:
                        field_stats = moving_stats[field]
                    except KeyError:
                        field_stats = moving_stats[field] = {}
                    field_stats[name] = follower.as_dict()
        return frame


class Bands:
    def __init__(self, sample_rate, band_settings):
        self._sample_rate = sample_rate
        self._band_settings = band_settings
        self._filters = {}

    def __call__(self, frame):
        for channel_index, channel in enumerate(frame['channels']):
            samples = channel['samples']
            channel['bands'] = {}
            for band_name, filter in self._filters_for_channel(
                    channel_index).items():
                band = {'samples': filter(samples)}
                channel['bands'][band_name] = band
        return frame

    def _filters_for_channel(self, channel_index):
        try:
            return self._filters[channel_index]
        except KeyError:
            filters = {
                name: BandPassFilter(
                    lowcut,
                    highcut,
                    fs=self._sample_rate,
                )
                for name, (lowcut, highcut) in self._band_settings.items()
            }
            self._filters[channel_index] = filters
            return filters


class Summarize:
    def __call__(self, frame):
        return self._summarize_frame(frame)

    def _summarize_frame(self, frame):
        summary = {
            'sample_rate': frame['sample_rate'],
            'samples': frame['center']['samples'],
        }
        summary.update(self._summarize_bands(frame['center']['bands']))
        summary.update(self._summarize_center(frame['center'], summary))
        return summary

    def _summarize_bands(self, bands):
        summary = {}
        for band_name, band in bands.items():
            slow_avg = band['moving_stats']['rms']['slow']['avg']
            slow_max = band['moving_stats']['rms']['slow']['max']
            mid_avg = band['moving_stats']['rms']['mid']['avg']
            mid_max = band['moving_stats']['rms']['mid']['max']
            fast_avg = band['moving_stats']['rms']['fast']['avg']
            fast_max = band['moving_stats']['rms']['fast']['max']
            normalized_rms = band['moving_stats']['rms']['slow'][
                'normalized_value']
            summary.update({
                '_'.join((band_name, 'max')):
                slow_max,
                '_'.join((band_name, 'avg')):
                slow_max,
                '_'.join((band_name, 'rms')):
                normalized_rms,
                '_'.join((band_name, 'peak_decay')):
                np.divide(mid_max - mid_avg, slow_max - mid_avg),
                '_'.join((band_name, 'fast_peak_decay')):
                np.divide(fast_max - fast_avg, slow_max - fast_avg),
            })
        return summary

    def _summarize_center(self, center, bands_summary):
        slow_avg = center['moving_stats']['rms']['slow']['avg']
        slow_max = center['moving_stats']['rms']['slow']['max']
        mid_avg = center['moving_stats']['rms']['mid']['avg']
        mid_max = center['moving_stats']['rms']['mid']['max']
        fast_avg = center['moving_stats']['rms']['fast']['avg']
        fast_max = center['moving_stats']['rms']['fast']['max']
        normalized_rms = center['moving_stats']['rms']['slow'][
            'normalized_value']
        high_rms_no_bass = np.maximum(
            0, bands_summary['high_rms'] - bands_summary['bass_rms'])
        mid_rms_no_bass = np.maximum(
            0, bands_summary['mid_rms'] - bands_summary['bass_rms'])
        high_peak_decay_no_bass = np.maximum(
            0, bands_summary['high_peak_decay'] -
            bands_summary['bass_peak_decay'])
        mid_peak_decay_no_bass = np.maximum(
            0,
            bands_summary['mid_peak_decay'] - bands_summary['bass_peak_decay'])
        return {
            'fft': center['fft'],
            'slow_fft': center['moving_stats']['fft']['slow']['max'],
            'high_peak_decay_no_bass': high_peak_decay_no_bass,
            'mid_peak_decay_no_bass': mid_peak_decay_no_bass,
            'high_rms_no_bass': high_rms_no_bass,
            'mid_rms_no_bass': mid_rms_no_bass,
            'max': slow_max,
            'rms': normalized_rms,
            'slow_rms': np.divide(fast_avg, slow_max),
            'peak_decay': np.divide(mid_max - mid_avg, slow_max - mid_avg),
            'fast_peak_decay': np.divide(fast_max - fast_avg,
                                         slow_max - fast_avg),
        }


class RawAudioProcessor:
    def __init__(self, sample_rate):
        self._sample_rate = sample_rate
        self._frame_processors = [
            fft,
            Bands(sample_rate, {
                'bass': (10, 250),
                'mid': (500, 2000),
                'high': (4000, 16000),
            }),
            rms,
            MovingStats(
                {
                    'fast': (0.06, ),
                    'mid': (0.02, ),
                    'slow': (0.00005, ),
                }, ['rms']),
            MovingStats({
                'slow': (0.2, ),
            }, ['fft'], skip_bands=True),
            Summarize(),
        ]

    def process_raw_audio(self, data):
        frame = {
            'channels': [],
            'sample_rate': self._sample_rate,
        }
        channel_count = data.shape[-1]
        for channel_index in range(channel_count):
            samples = data[:, channel_index]
            channel = {}
            frame['channels'].append(channel)
            channel['samples'] = samples
        # TODO: real center for channels > 1.
        frame['center'] = frame['channels'][0]
        for frame_processor in self._frame_processors:
            frame = frame_processor(frame)
        return frame
