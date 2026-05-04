export default function Custom500() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", textAlign: "center" }}>
      <div>
        <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: "14px" }}>500</p>
        <h1 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: 600 }}>页面暂时不可用</h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>请稍后重试。</p>
      </div>
    </main>
  )
}
