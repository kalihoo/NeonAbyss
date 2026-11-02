export type UploadedFish = {
  id: string
  name: string
  blob: Blob
  createdAt: number
}

const databaseName = 'neonabyss-aquarium'
const storeName = 'uploaded-fish'
let databasePromise: Promise<IDBDatabase> | undefined

function openDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('当前浏览器不支持本地图片存储'))
  if (databasePromise) return databasePromise

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'id' })
    }
    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => database.close()
      resolve(database)
    }
    request.onerror = () => reject(request.error ?? new Error('无法打开本地鱼图存储'))
    request.onblocked = () => reject(new Error('本地鱼图存储正在被另一个页面占用，请关闭重复页面后重试'))
  }).catch(error => {
    databasePromise = undefined
    throw error
  })

  return databasePromise
}

export async function getUploadedFish() {
  const database = await openDatabase()
  return new Promise<UploadedFish[]>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll()
    let records: UploadedFish[] = []
    request.onsuccess = () => { records = request.result as UploadedFish[] }
    request.onerror = () => reject(request.error ?? new Error('读取本地鱼图失败'))
    transaction.oncomplete = () => resolve(records.sort((a, b) => a.createdAt - b.createdAt))
    transaction.onerror = () => reject(transaction.error ?? new Error('读取本地鱼图失败'))
    transaction.onabort = () => reject(transaction.error ?? new Error('读取本地鱼图失败'))
  })
}

export async function saveUploadedFish(record: UploadedFish) {
  const database = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('保存鱼图失败'))
    transaction.onabort = () => reject(transaction.error ?? new Error('保存鱼图失败'))
  })
}

export async function deleteUploadedFish(id: string) {
  const database = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('删除鱼图失败'))
    transaction.onabort = () => reject(transaction.error ?? new Error('删除鱼图失败'))
  })
}
