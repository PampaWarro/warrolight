import numpy as np
import scipy.signal
import logging

logger = logging.getLogger(__name__)


class PeakExpDecayFollower:
    def __init__(self, alpha, invert=False):
        self.alpha = alpha
        self.invert = invert
        self.value = None

    def __call__(self, new_value):
        if self.value is None:
            self.value = new_value
            return self.value
        self.value *= (1.0 - self.alpha)
        self.value += new_value * self.alpha
        if self.invert:
            self.value = np.minimum(self.value, new_value)
        else:
            self.value = np.maximum(self.value, new_value)
        return self.value


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


def rms(frame):
    for channel in frame['channels']:
        samples = channel['samples']
        channel['rms'] = np.sqrt(np.mean(samples**2))
        for _, band in channel['bands'].items():
            samples = band['samples']
            band['rms'] = np.sqrt(np.mean(samples**2))


def max(frame):
    for channel in frame['channels']:
        samples = channel['samples']
        channel['max'] = np.max(np.absolute(samples))
        for _, band in channel['bands'].items():
            samples = band['samples']
            band['max'] = np.max(np.absolute(samples))


class PeakDecay:
    def __init__(self, values, fields, enable_bands=False):
        self._values = values
        self._fields = fields
        self._followers = {}
        self._enable_bands = enable_bands

    def _followers_for_channel(self, channel_index):
        try:
            return self._followers[channel_index]
        except KeyError:
            followers = {(prefix, field): PeakExpDecayFollower(*args)
                         for prefix, args in self._values.items()
                         for field in self._fields}
            self._followers[channel_index] = followers
            return followers

    def _followers_for_band(self, channel_index, band_name):
        key = (channel_index, band_name)
        try:
            return self._followers[key]
        except KeyError:
            followers = {(prefix, field): PeakExpDecayFollower(*args)
                         for prefix, args in self._values.items()
                         for field in self._fields}
            self._followers[key] = followers
            return followers

    def __call__(self, frame):
        for channel_index, channel in enumerate(frame['channels']):
            followers = self._followers_for_channel(channel_index)
            for ((prefix, field), follower) in followers.items():
                new_field_name = '_'.join((prefix, field))
                channel[new_field_name] = follower(channel[field])
            if not self._enable_bands:
                continue
            for band_name, band in channel['bands'].items():
                followers = self._followers_for_band(channel_index, band_name)
                for ((prefix, field), follower) in followers.items():
                    new_field_name = '_'.join((prefix, field))
                    band[new_field_name] = follower(band[field])


class Normalize:
    def __init__(self, fields, prefixes, max_prefix, min_prefix=None):
        self._fields = fields
        self._prefixes = prefixes
        self._max_prefix = max_prefix
        self._min_prefix = min_prefix

    def __call__(self, frame):
        channels = []
        for channel in frame['channels']:
            channels.append(channel)
            for _, band in channel['bands'].items():
                channels.append(band)
        for channel in channels:
            for field in self._fields:
                max = channel['_'.join((self._max_prefix, field))]
                if self._min_prefix is None:
                    min = 0
                else:
                    min = channel['_'.join((self._min_prefix, field))]
                for prefix in self._prefixes:
                    field_name = '_'.join((prefix, field))
                    value = channel[field_name]
                    channel['_'.join(
                        ('normalized',
                         field_name))] = self._normalize(value, max, min)

    def _normalize(self, num, max, min):
        den = max - min
        if den <= 0:
            return 0
        return (num - min) / den


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


class Deflate:
    def __call__(self, frame):
        # delete "channels" key, only need center in the end.
        del frame['channels']
        for _, band in frame['center']['bands'].items():
            del band['samples']


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
            max,
            PeakDecay(
                {
                    'fast': (0.05, ),
                    'mid': (0.01, ),
                    'slow': (0.001, ),
                    'slowest': (0.00005, ),
                }, ['rms', 'max'], enable_bands=True),
            PeakDecay({
                'slowest_min': (
                    0.00005,
                    True,
                ),
            }, ['rms', 'max'], enable_bands=True),
            PeakDecay({
                'slow': (0.1, ),
            }, ['fft']),
            Normalize(['rms', 'max'], ['fast', 'mid', 'slow'], 'slowest',
                      'slowest_min'),
            Deflate(),
        ]

    def process_raw_audio(self, data):
        frame = {
            'channels': [],
            'samplerate': self._sample_rate,
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
            frame_processor(frame)
        return frame
