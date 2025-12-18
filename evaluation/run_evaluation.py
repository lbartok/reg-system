#!/usr/bin/env python3
import os
import re
import sys
import json
from urllib.parse import urljoin
import requests

BASE_URL = os.getenv('EVAL_BASE_URL', 'http://localhost:3000')

def get_home():
    url = urljoin(BASE_URL, '/')
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    text = r.text
    if 'Order ID' not in text:
        return False, 'Order ID text missing', None
    # extract hidden input value orderId
    m = re.search(r'name="orderId"\s+value="(\d+)"', text)
    if not m:
        # fallback: find strong tag with digits
        m2 = re.search(r'<strong>(\d+)</strong>', text)
        if not m2:
            return False, 'orderId not found in page', None
        order_id = m2.group(1)
    else:
        order_id = m.group(1)
    return True, 'OK', order_id

def post_order(order_id):
    url = urljoin(BASE_URL, '/order')
    r = requests.post(url, data={'orderId': order_id}, timeout=10)
    r.raise_for_status()
    text = r.text
    if 'Order received' not in text:
        return False, 'confirmation missing'
    if order_id not in text:
        return False, 'order id not echoed back'
    return True, 'OK'

def main():
    print(f'Evaluating {BASE_URL}')
    ok, msg, order_id = get_home()
    results = []
    results.append({'test': 'get_home', 'ok': ok, 'msg': msg})
    if not ok:
        print('GET / failed:', msg)
        print(json.dumps(results, indent=2))
        sys.exit(2)
    print('Got order id:', order_id)
    ok2, msg2 = post_order(order_id)
    results.append({'test': 'post_order', 'ok': ok2, 'msg': msg2})
    if not ok2:
        print('POST /order failed:', msg2)
        print(json.dumps(results, indent=2))
        sys.exit(3)
    print('All checks passed')
    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
