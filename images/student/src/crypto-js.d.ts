declare module 'crypto-js/md5' {
  import { lib } from 'crypto-js'
  function MD5(message: string): lib.WordArray
  export default MD5
}
