#!/bin/bash

# OPMLインポートテスト用スクリプト
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWJseHZrbXgwMDAwdHRyMjA0MjY5OGF6IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzQ5MjgyOTA1LCJleHAiOjE3NDkzNjkzMDV9.gdTOVhO4GR5tXV67Tzg10VHY0kb6qXNcHlFOwOlV4HQ"

echo "OPMLファイルをインポート中..."
curl -X POST http://localhost:3001/api/opml/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@assets/sample"

echo -e "\n\n登録されたフィードを確認..."
curl -X GET "http://localhost:3001/api/feeds?limit=100" \
  -H "Authorization: Bearer $TOKEN"