#!/bin/sh
if [ -f /sys/fs/cgroup/memory.max ]; then
  max_ram_bytes=$(cat /sys/fs/cgroup/memory.max)
elif [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
  max_ram_bytes=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
else
  max_ram_bytes=""
fi

case "$max_ram_bytes" in
  ''|*[!0-9]*) max_ram_bytes="" ;;
esac

if [ -n "$max_ram_bytes" ]; then
  max_ram=$((max_ram_bytes / 1024 / 1024))
  old_space_size=$((max_ram - 356))
else
  old_space_size=""
fi

if [ -z "$old_space_size" ] || [ "$old_space_size" -lt 256 ]; then
  old_space_size=1024
fi

exec node --max-old-space-size="$old_space_size" --max-semi-space-size=32 --optimize_for_size --gc_interval=100 --v8-pool-size=0 --use-largepages=silent /dist/src/index.js
