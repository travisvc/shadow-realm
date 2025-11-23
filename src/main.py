import bittensor as bt
from config import Logger
from database import Tick, get_db_session

logger = Logger.get_logger(__name__)

logger.info("The shadow trader is running...")

subtensor = bt.subtensor(network="wss://archive.chain.opentensor.ai:443")

coldkey = "5DoAKfL58HSgynPxM1mUpyw8Fm6wS9PREZcCj4Heooq5uN4B"

# # query data from database
# session = get_db_session()
# ticks = session.query(Tick).all()
# for tick in ticks:
#     logger.info(f"Block number: {tick.block_number}")


# # query number of ticks in database
# num_ticks = session.query(Tick).count()
# logger.info(f"Number of ticks in database: {num_ticks}")

# # query latest tick in database
# latest_tick = session.query(Tick).order_by(Tick.block_number.desc()).first()
# logger.info(f"Latest tick in database: {latest_tick.block_number}")
# logger.info(f"Timestamp: {latest_tick.timestamp}")
# logger.info(f"Address: {latest_tick.address}")
# logger.info(f"Call module: {latest_tick.call_module}")
# logger.info(f"Call function: {latest_tick.call_function}")
# logger.info(f"Call args: {latest_tick.call_args}")

# # query based on coldkey
# coldkey_ticks = session.query(Tick).filter(Tick.address == coldkey).all()
# logger.info(f"Number of ticks for coldkey: {len(coldkey_ticks)}")
# for tick in coldkey_ticks:
#     logger.info(f"Block number: {tick.block_number}")


def calculate_total_balance(coldkey: str):
    # Free balance
    free_balance = subtensor.get_balance(coldkey)
    logger.info(f"Free balance: {free_balance}")

    # Staked balance
    coldkey_stake = subtensor.get_stake_for_coldkey(coldkey_ss58=coldkey)
    total_staked_rao = 0
    for stake_object in coldkey_stake:
        price = subtensor.get_subnet_price(netuid=stake_object.netuid)
        total_staked_rao += (stake_object.stake.rao * price.rao) // 1_000_000_000

    total_staked = bt.Balance.from_rao(int(total_staked_rao))
    logger.info(f"Total staked: {total_staked}")

    # Total balance
    total_balance = free_balance + total_staked
    logger.info(f"Total balance: {total_balance}")

    return total_balance

while True:
    subtensor.wait_for_block()

    current_block = subtensor.get_current_block()
    timestamp = subtensor.get_timestamp(block=current_block)
    logger.info(f"Timestamp: {timestamp} - Block: {current_block}")

    block_hash = subtensor.get_block_hash(current_block)
    block = subtensor.substrate.get_block(block_hash=block_hash)
    
    # Check extrinsics for coldkey
    extrinsics = block.get('extrinsics', [])
    for extrinsic in extrinsics:
        if coldkey in str(extrinsic):
            # logger.info(f"Found coldkey in extrinsic: {extrinsic}")
            value = extrinsic.value
            call = value['call']
            
            logger.info(f"Address: {value['address']}")
            logger.info(f"Call Module: {call['call_module']}")
            logger.info(f"Call Function: {call['call_function']}")
            for arg in call['call_args']:
                logger.info(f"  - {arg['name']}: {arg['value']}")
            
            # Save to database
            session = get_db_session()
            try:
                tick = Tick(
                    block_number=current_block,
                    timestamp=timestamp,
                    address=value['address'],
                    call_module=call['call_module'],
                    call_function=call['call_function'],
                    call_args=call['call_args']
                )
                session.add(tick)
                session.commit()
                logger.info("Saved to database")
            except Exception as e:
                session.rollback()
                logger.error(f"Error saving to database: {e}")
            finally:
                session.close()

            total_balance = calculate_total_balance(coldkey)

    