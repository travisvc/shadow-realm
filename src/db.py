from sqlalchemy import create_engine, Column, Integer, String, BigInteger, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

Base = declarative_base()


class Extrinsic(Base):
    __tablename__ = 'extrinsics'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    block_number = Column(BigInteger, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    address = Column(String, nullable=False)
    call_module = Column(String, nullable=False)
    call_function = Column(String, nullable=False)
    hotkey = Column(String, nullable=True)
    netuid = Column(Integer, nullable=True)
    amount_staked = Column(BigInteger, nullable=True)
    limit_price = Column(BigInteger, nullable=True)
    
    
class Tick(Base):
    __tablename__ = 'ticks'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    block_number = Column(BigInteger, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    balance = Column(JSONB, nullable=False)


class Database:
    def __init__(self):
        database_url = os.getenv('DATABASE_URL', 'postgresql://danny_phantom:vHC4jr7LVq1I4D2x0rLG@localhost:5432/danny_phantom')
        self.engine = create_engine(database_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
    
    def save(self, obj):
        session = self.Session()
        try:
            session.add(obj)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
