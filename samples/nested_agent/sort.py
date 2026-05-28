import sys\n\nnums = list(map(int, sys.stdin.read().split()))\nsorted_nums = sorted(nums)\nprint(' '.join(map(str, sorted_nums)))
