/**
 * 支付订单 localStorage 管理
 * 用于支付成功页的订单号回退查询
 */

const LAST_ORDER_NO_KEY = 'joyfulwords-last-payment-order-no'

/**
 * 保存最后一个支付的订单号
 * @param orderNo - 订单号
 */
export function saveLastOrderNo(orderNo: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(LAST_ORDER_NO_KEY, orderNo)
    console.debug('[PaymentLocalStorage] 保存订单号到 localStorage', { orderNo })
  } catch (error) {
    console.warn('[PaymentLocalStorage] 保存订单号失败', error)
  }
}

/**
 * 获取最后一个支付的订单号
 * @returns 订单号，不存在则返回 null
 */
export function getLastOrderNo(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const orderNo = localStorage.getItem(LAST_ORDER_NO_KEY)
    if (orderNo) {
      console.debug('[PaymentLocalStorage] 从 localStorage 读取订单号', { orderNo })
    }
    return orderNo
  } catch (error) {
    console.warn('[PaymentLocalStorage] 读取订单号失败', error)
    return null
  }
}

/**
 * 清除最后一个支付的订单号
 * 支付成功或失败后调用，避免旧数据污染
 */
export function clearLastOrderNo(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(LAST_ORDER_NO_KEY)
    console.debug('[PaymentLocalStorage] 清除订单号')
  } catch (error) {
    console.warn('[PaymentLocalStorage] 清除订单号失败', error)
  }
}
