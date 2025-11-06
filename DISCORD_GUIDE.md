# 📅 定期通知Bot 使い方ガイド

このBotを使うと、指定した時間に自動でメンションを送信できます！

## 🚀 基本的な使い方

### 簡単モード（おすすめ）

時間と頻度を選ぶだけで設定できます：

```
/schedule add channel:#general mention:@everyone message:おはようございます！ hour:9 frequency:平日のみ
```

**設定項目：**
- `channel` - メッセージを送信するチャンネル
- `mention` - メンション種類（@everyone、@here、ロール、ユーザー）
- `message` - 送信するメッセージ
- `hour` - 送信時刻（時、0〜23）
- `minute` - 送信時刻（分、0〜59）※省略すると0分
- `frequency` - 頻度（下記参照）

**頻度の選択肢：**
- `毎日` - 毎日送信
- `平日のみ（月〜金）` - 平日だけ送信
- `週末のみ（土日）` - 週末だけ送信
- `月曜日` / `火曜日` / ... / `日曜日` - 特定の曜日のみ

## 📝 使用例

### 例1: 平日の朝の挨拶
```
/schedule add channel:#general mention:@everyone message:おはようございます！今日も頑張りましょう！ hour:9 frequency:平日のみ
```
→ 平日の9時に送信

### 例2: 毎日のお昼のお知らせ
```
/schedule add channel:#general mention:@here message:お昼休憩の時間です hour:12 minute:30 frequency:毎日
```
→ 毎日12時30分に送信

### 例3: 週末のイベント告知
```
/schedule add channel:#events mention:@everyone message:週末イベント開催中！ hour:10 frequency:週末のみ
```
→ 土日の10時に送信

### 例4: 特定のロールにメンション
```
/schedule add channel:#team mention:role target:@開発チーム message:定例会議の時間です hour:14 frequency:月曜日
```
→ 毎週月曜14時に@開発チームにメンション

## 🔧 その他のコマンド

### スケジュール一覧を見る
```
/schedule list
```
複数ページある場合は：
```
/schedule list page:2
```

### スケジュールを削除
```
/schedule remove id:1
```
※IDは`/schedule list`で確認できます

### スケジュールを一時停止
```
/schedule pause id:1
```

### スケジュールを再開
```
/schedule resume id:1
```

### テスト送信（すぐに送信）
```
/schedule test id:1
```

## 💡 ヒント

- **時間はJST（日本時間）で設定されます**
- メンション対象を指定する場合は`target`オプションを使用します
- スケジュールは最大25個まで登録できます（1ページ10個表示）
- Bot再起動後もスケジュールは保持されます

## ⚠️ 注意事項

- このコマンドを使うには「サーバー管理」または「管理者」権限が必要です
- @everyoneや@hereを使う場合、Botに「@everyoneにメンション」権限が必要です

---

困ったことがあれば管理者に相談してください！

