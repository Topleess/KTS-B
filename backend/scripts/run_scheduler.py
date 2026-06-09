import argparse
import asyncio

from app.services.scheduler_service import run_scheduler


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Cosmeto background job scheduler")
    parser.add_argument("--tick-seconds", type=float, default=None, help="Override scheduler tick interval")
    parser.add_argument("--max-ticks", type=int, default=None, help="Stop after N ticks; useful for smoke tests")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    await run_scheduler(tick_seconds=args.tick_seconds, max_ticks=args.max_ticks)


if __name__ == "__main__":
    asyncio.run(main())
