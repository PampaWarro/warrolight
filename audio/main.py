from logging.config import dictConfig

dictConfig({
    'version': 1,
    'formatters': {
        'default': {
            'format': '[%(asctime)s] %(levelname)s %(name)s: %(message)s',
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'default',
        }
    },
    'loggers': {},
    'root': {
        'level': 'INFO',
        'handlers': ['console']
    }
})

import argparse
import sounddevice as sd
import numpy as np
import logging
import sys
from processor import RawAudioProcessor
import msgpack
import stringcase
import time

logger = logging.getLogger(__name__)


def encode(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (np.float32, np.int64, np.int32)):
        return obj.item()
    return obj


CAMEL_CACHE = {}

def to_camel(s):
    try:
        return CAMEL_CACHE[s]
    except KeyError:
        camel = stringcase.camelcase(s)
        CAMEL_CACHE[s] = camel
        return camel

def obj_to_camel(o):
    if isinstance(o, dict):
        return {
            to_camel(k): obj_to_camel(v)
            for k, v in o.items()
        }
    if isinstance(o, (list, tuple)):
        return [obj_to_camel(x) for x in o]
    return o


def write_output_frame(frame):
    sys.stdout.buffer.write(
        msgpack.packb(obj_to_camel(frame), use_bin_type=True, default=encode))
    sys.stdout.buffer.flush()


def audio_loop(device=None, sample_rate=48000, frame_size=512):
    processor = RawAudioProcessor(sample_rate)
    try:
        if device is None:
            device_info = sd.query_devices(kind='input')
        else:
            device_info = sd.query_devices(device)
    except sd.PortAudioError:
        fake_data = np.zeros((frame_size, 1))
        frame = processor.process_raw_audio(fake_data)
        logger.error('Error querying devices, producing fake frame (silence).')
        write_output_frame(frame)
        raise
    logger.info('Using device "%s".', device_info['name'])
    with sd.InputStream(device=device,
                        samplerate=sample_rate,
                        blocksize=frame_size,
                        channels=1,
                        latency='low') as input_stream:
        while True:
            data, overflowed = input_stream.read(frame_size)
            if overflowed:
                logger.error('Audio buffer overflowed.')
            frame = processor.process_raw_audio(data)
            write_output_frame(frame)


def main():
    parser = argparse.ArgumentParser(
        description='Read and process audio input.')
    parser.add_argument('-d',
                        '--device',
                        type=int,
                        help='Index of the input device',
                        default=None)
    parser.add_argument('-l',
                        '--list_devices',
                        action='store_true',
                        help='Show list of audio devices and exit')
    parser.add_argument('-r',
                        '--retry_interval',
                        type=float,
                        help='Time in seconds between retries on audio errors',
                        default=1.)
    parser.add_argument('-s',
                        '--sample_rate',
                        type=float,
                        help='Audio sampling frequency',
                        default=48000.)
    parser.add_argument('-f',
                        '--frame_size',
                        type=int,
                        help='Audio frame size',
                        default=512)
    args = parser.parse_args()
    if args.list_devices:
        print(sd.query_devices())
        return
    while True:
        try:
            audio_loop(device=args.device,
                       sample_rate=args.sample_rate,
                       frame_size=args.frame_size)
        except sd.PortAudioError:
            logger.exception('Audio error, retrying...')
            time.sleep(args.retry_interval)


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, BrokenPipeError):
        # User pressed ^C or parent process closed pipe, this is expected.
        pass
