from sqlalchemy import create_engine, Column, Integer, String, BigInteger, Boolean, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

Base = declarative_base()


class Tick(Base):
    __tablename__ = 'ticks'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    block_number = Column(BigInteger, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    address = Column(String, nullable=False)
    call_module = Column(String, nullable=False)
    call_function = Column(String, nullable=False)
    call_args = Column(JSON, nullable=False)


def get_db_session():
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/danny_phantom')
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()

