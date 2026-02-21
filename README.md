# Tirana Public Transport (GTFS)

Monorepo structure:
- /ingest  -> downloads + parses GTFS, writes JSON into /data
- /data    -> published JSON artifacts consumed by the app
- /mobile  -> Expo React Native app
- /.github -> scheduled GitHub Action that refreshes /data

## Local dev

### 1) Run ingest (build /data)
cd ingest
npm i
npm run ingest

### 2) Run mobile app
cd mobile
npm i
npx expo start