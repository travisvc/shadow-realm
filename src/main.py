import bittensor as bt
from config import Logger

logger = Logger.get_logger(__name__)

logger.info("The shadow trader is running...")

subtensor = bt.subtensor(network="wss://archive.chain.opentensor.ai:443")

coldkey = "5DoAKfL58HSgynPxM1mUpyw8Fm6wS9PREZcCj4Heooq5uN4B"
hotkey = "5GKH9FPPnWSUoeeTJp19wVtd84XqFW4pyK2ijV2GsFbhTrP1" # taostats validator


def calculate_total_balance():
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

    block_hash = subtensor.get_block_hash(6945998)
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


    # last_stake_block = subtensor.query_subtensor('LastColdkeyHotkeyStakeBlock', params=[coldkey, hotkey]).value
    # logger.info(f"Last stake block: {last_stake_block}")

    # total_balance = calculate_total_balance()