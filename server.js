/**
 * 永迈印刷 - 云端数据同步服务端
 * 
 * 纯 Node.js，零编译依赖，JSON文件存储
 * 
 * 部署方式：
 *   1. 本地开发:  node server.js
 *   2. 免费部署:  Railway / Render / Zeabur（上传整个 server/ 目录）
 *   3. 自有服务器: 用 pm2 管理
 * 
 * 启动后访问: http://localhost:3000/api/sync/test
 */

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data')
const SYNC_FILE = path.join(DATA_DIR, 'sync_data.json')
const AUTH_FILE = path.join(DATA_DIR, 'auth_users.json')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ============ 数据存储工具 ============
function loadData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch (e) {
    console.error('读取数据文件失败:', e.message)
  }
  return {}
}

function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function getRecords() {
  return loadData(SYNC_FILE)
}

function saveRecords(records) {
  saveData(SYNC_FILE, records)
}

function now() {
  return new Date().toISOString()
}

// ============ 健康检查 ============
app.get('/api/sync/test', (req, res) => {
  const records = getRecords()
  const keyCount = Object.keys(records).length
  res.json({
    success: true,
    server: 'yongmai-sync-server',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    records: keyCount,
    keys: Object.keys(records)
  })
})

// ============ 保存单条数据 ============
app.post('/api/sync/save', (req, res) => {
  try {
    const { key, data, version } = req.body
    const records = getRecords()

    // 版本检查：防止旧数据覆盖新数据
    if (records[key] && records[key].version >= (version || 0)) {
      return res.json({ success: true, skipped: true })
    }

    records[key] = {
      data: data,
      version: version || 1,
      updated_at: now()
    }
    saveRecords(records)

    console.log(`[save] ${key} v${version}`)
    res.json({ success: true, version })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============ 批量保存 ============
app.post('/api/sync/saveAll', (req, res) => {
  try {
    const { key, data, version } = req.body
    const records = getRecords()

    if (records[key] && records[key].version >= (version || 0)) {
      return res.json({ success: true, skipped: true })
    }

    records[key] = {
      data: data,
      version: version || 1,
      updated_at: now()
    }
    saveRecords(records)

    console.log(`[saveAll] ${key} v${version}`)
    res.json({ success: true, version })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============ 加载单条数据 ============
app.post('/api/sync/load', (req, res) => {
  try {
    const { key, version: localVersion } = req.body
    const records = getRecords()
    const record = records[key]

    if (!record) {
      return res.json({ success: true, data: null })
    }

    // 本地已是最新
    if (localVersion >= record.version) {
      return res.json({ success: true, data: null, upToDate: true })
    }

    res.json({ success: true, data: record.data, version: record.version })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============ 批量加载数据 ============
app.post('/api/sync/loadAll', (req, res) => {
  try {
    const { keys, versions } = req.body
    const records = getRecords()
    const result = {}
    const resultVersions = {}

    for (const key of keys) {
      const record = records[key]
      if (record) {
        const localVer = versions[key] || 0
        if (record.version > localVer) {
          result[key] = record.data
          resultVersions[key] = record.version
        }
      }
    }

    res.json({ success: true, data: result, versions: resultVersions })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============ 删除数据 ============
app.post('/api/sync/remove', (req, res) => {
  try {
    const { key } = req.body
    const records = getRecords()
    delete records[key]
    saveRecords(records)

    console.log(`[remove] ${key}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============ 检查更新 ============
app.post('/api/sync/checkUpdate', (req, res) => {
  try {
    const { versions } = req.body
    const records = getRecords()
    const updatedKeys = []

    for (const [key, localVersion] of Object.entries(versions)) {
      const record = records[key]
      if (record && record.version > localVersion) {
        updatedKeys.push(key)
      }
    }

    res.json({ success: true, updatedKeys })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============ 获取所有数据概览 ============
app.get('/api/sync/all', (req, res) => {
  const records = getRecords()
  const summary = Object.entries(records).map(([key, val]) => ({
    key,
    version: val.version,
    updated_at: val.updated_at
  }))
  res.json({ success: true, total: summary.length, records: summary })
})

// ============ 启动服务 ============
app.listen(PORT, () => {
  console.log('')
  console.log('  ╔══════════════════════════════════════════╗')
  console.log('  ║   永迈印刷 - 云端数据同步服务端         ║')
  console.log('  ║                                          ║')
  console.log(`  ║   服务地址:  http://localhost:${PORT}          ║`)
  console.log(`  ║   健康检查:  http://localhost:${PORT}/api/sync/test  ║`)
  console.log('  ║                                          ║')
  console.log('  ║   前端配置:                              ║')
  console.log('  ║   SYNC_MODE = "server"                  ║')
  console.log(`  ║   SERVER_URL = "http://localhost:${PORT}/api/sync" ║`)
  console.log('  ╚══════════════════════════════════════════╝')
  console.log('')
})
