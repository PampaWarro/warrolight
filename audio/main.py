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


def audio_loop(device=None, sample_rate=48000, frame_size=512, fake_audio=False):
    logger.info('Fake audio: %s.', fake_audio)
    processor = RawAudioProcessor(sample_rate=sample_rate, fake_audio=fake_audio)
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
    parser.add_argument('-f',
                        '--fake_audio',
                        action='store_true',
                        help='Enable fake audio values generation')
    parser.add_argument('-l',
                        '--list_devices',
                        action='store_true',
                        help='Show list of audio devices and exit')
    args = parser.parse_args()
    if args.list_devices:
        print(sd.query_devices())
        return
    if args.device is None:
        device = sd.query_devices(kind='input')
    else:
        device = sd.query_devices(args.device)
    logger.info('Using device "%s".', device['name'])
    try:
        audio_loop(device=args.device, fake_audio=args.fake_audio)
    except (KeyboardInterrupt, BrokenPipeError):
        pass


if __name__ == '__main__':
    main()
