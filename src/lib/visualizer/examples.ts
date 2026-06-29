export interface ExampleInput {
  name: string;
  label: string;
  type: 'array' | 'number' | 'string' | 'linked-list';
  defaultValue: any;
}

export interface PresetExample {
  id: string;
  name: string;
  description: string;
  code: string;
  startClassName: string;
  startMethodName: string;
  inputs: ExampleInput[];
}

export const EXAMPLES: PresetExample[] = [
  {
    id: 'binary-search',
    name: 'Binary Search',
    description: 'Finds the index of a target element in a sorted array using divide-and-conquer. Pointers left, right, and mid narrowing down the search space.',
    code: `class Solution {
    public int binarySearch(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            if (arr[mid] == target) {
                System.out.println("Found target at index: " + mid);
                return mid;
            }
            
            if (arr[mid] < target) {
                System.out.println(arr[mid] + " is less than target. Moving left pointer.");
                left = mid + 1;
            } else {
                System.out.println(arr[mid] + " is greater than target. Moving right pointer.");
                right = mid - 1;
            }
        }
        
        System.out.println("Target not found.");
        return -1;
    }
}`,
    startClassName: 'Solution',
    startMethodName: 'binarySearch',
    inputs: [
      { name: 'arr', label: 'Sorted Array (arr)', type: 'array', defaultValue: [2, 4, 7, 10, 15, 22, 34, 45, 56, 70] },
      { name: 'target', label: 'Target to search', type: 'number', defaultValue: 34 }
    ]
  },
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    description: 'Repeatedly steps through the array, compares adjacent elements, and swaps them if they are in the wrong order. Shows elements bubbled up to the end.',
    code: `class Solution {
    public void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    // Swap arr[j] and arr[j+1]
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}`,
    startClassName: 'Solution',
    startMethodName: 'bubbleSort',
    inputs: [
      { name: 'arr', label: 'Unsorted Array (arr)', type: 'array', defaultValue: [5, 1, 4, 2, 8] }
    ]
  },
  {
    id: 'linked-list-reverse',
    name: 'Reverse Linked List',
    description: 'Reverses a singly linked list in-place by flipping the next pointers of each node. Tracks prev, curr, and next pointers.',
    code: `class Solution {
    public Node reverse(Node head) {
        Node prev = null;
        Node curr = head;
        
        while (curr != null) {
            Node next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        
        return prev;
    }
}

class Node {
    int val;
    Node next;
    
    public Node(int val) {
        this.val = val;
    }
}`,
    startClassName: 'Solution',
    startMethodName: 'reverse',
    inputs: [
      { name: 'head', label: 'Linked List Elements', type: 'linked-list', defaultValue: [10, 20, 30, 40, 50] }
    ]
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci (Recursion)',
    description: 'Calculates the N-th Fibonacci number recursively. Perfect for visualizing the growth of call stack frames and stack depth.',
    code: `class Solution {
    public int fib(int n) {
        if (n <= 1) {
            return n;
        }
        
        System.out.println("Calculating fib(" + (n - 1) + ") + fib(" + (n - 2) + ")");
        return fib(n - 1) + fib(n - 2);
    }
}`,
    startClassName: 'Solution',
    startMethodName: 'fib',
    inputs: [
      { name: 'n', label: 'N-th Fibonacci Number', type: 'number', defaultValue: 5 }
    ]
  },
  {
    id: 'two-sum',
    name: 'Two Sum (Two Pointers)',
    description: 'Finds two numbers in a sorted array that sum up to a target value using two pointers from left and right inwards.',
    code: `class Solution {
    public int[] twoSum(int[] arr, int target) {
        int i = 0;
        int j = arr.length - 1;
        
        while (i < j) {
            int sum = arr[i] + arr[j];
            
            if (sum == target) {
                System.out.println("Found match at indices: " + i + ", " + j);
                int[] res = {i, j};
                return res;
            }
            
            if (sum < target) {
                System.out.println("Sum is " + sum + " (< target). Incrementing left index.");
                i++;
            } else {
                System.out.println("Sum is " + sum + " (> target). Decrementing right index.");
                j--;
            }
        }
        
        int[] empty = {-1, -1};
        return empty;
    }
}`,
    startClassName: 'Solution',
    startMethodName: 'twoSum',
    inputs: [
      { name: 'arr', label: 'Sorted Array (arr)', type: 'array', defaultValue: [1, 3, 5, 8, 12, 19, 21, 30] },
      { name: 'target', label: 'Target Sum', type: 'number', defaultValue: 27 }
    ]
  }
];
