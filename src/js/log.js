const DEBUG = false
export default class Log {
  static trigger (scope, detail) {
    const message = `${performance.now().toFixed(1)} ms: ${scope}`
    /* eslint-disable no-console */
    if (DEBUG) {
      console.log(message)
    }
    /* eslint-disable */
    if (detail && detail.vue) {
      detail.vue.$root.$emit(scope, detail)
      delete detail.vue
    }
    this.appendToElement(message, detail)
  }

  static appendToElement(message, detail) {
    const el = document.querySelector('#debug')

    if (el) {
      const detailString = Object.values(detail || []).join(' ')
      if (detailString.length > 0){
        message += ` - ${ detailString }`
      }
      el.insertAdjacentHTML('afterbegin', `${message}<br/>`)
    }
  }
}
