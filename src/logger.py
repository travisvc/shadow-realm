import logging

class ColoredFormatter(logging.Formatter):
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record):
        log_color = self.COLORS.get(record.levelname, '')
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)
 
class Logger:
    _configured = False
    
    @classmethod
    def get_logger(cls, name, level=logging.INFO):
        if not cls._configured:
            handler = logging.StreamHandler()
            handler.setFormatter(ColoredFormatter('%(asctime)s %(name)s %(levelname)s  %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
            logging.getLogger().setLevel(level)
            logging.getLogger().addHandler(handler)
            cls._configured = True
        return logging.getLogger(name)
