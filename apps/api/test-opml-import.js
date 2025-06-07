const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');

// テスト用のスクリプト - サンプルOPMLファイルでインポートをテスト
async function testOpmlImport() {
  try {
    // まず登録/ログインが必要
    console.log('テストユーザーでログイン...');
    
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    let token;
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log('ログイン成功');
    } else {
      // ユーザーが存在しない場合は新規登録
      console.log('ユーザーが存在しないため新規登録...');
      const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
      });
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        token = registerData.token;
        console.log('新規登録成功');
      } else {
        throw new Error('登録に失敗しました');
      }
    }

    // サンプルOPMLファイルを読み込み
    const opmlPath = path.join(__dirname, 'assets', 'sample');
    const opmlContent = fs.readFileSync(opmlPath);

    // FormDataを作成
    const form = new FormData();
    form.append('file', opmlContent, {
      filename: 'sample.opml',
      contentType: 'text/xml'
    });

    console.log('OPMLファイルをインポート中...');
    
    // OPMLインポートAPIを呼び出し
    const importResponse = await fetch('http://localhost:3001/api/opml/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });

    const result = await importResponse.json();
    
    if (importResponse.ok) {
      console.log('インポート成功:', result);
      console.log(`インポート済み: ${result.imported}件`);
      console.log(`失敗: ${result.failed}件`);
      if (result.errors.length > 0) {
        console.log('エラー:', result.errors);
      }
    } else {
      console.error('インポート失敗:', result);
    }

    // 登録されたフィードを確認
    console.log('登録されたフィードを確認...');
    const feedsResponse = await fetch('http://localhost:3001/api/feeds?limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (feedsResponse.ok) {
      const feedsData = await feedsResponse.json();
      console.log(`登録済みフィード数: ${feedsData.feeds.length}件`);
      feedsData.feeds.forEach((feed, index) => {
        console.log(`${index + 1}. ${feed.title} - ${feed.url}`);
      });
    }

  } catch (error) {
    console.error('テストエラー:', error);
  }
}

// テスト実行
if (require.main === module) {
  testOpmlImport();
}