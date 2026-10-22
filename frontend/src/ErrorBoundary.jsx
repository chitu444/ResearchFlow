import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f6f1ec',color:'#2d2524',fontFamily:'Arial,sans-serif'}}>
        <div style={{maxWidth:720,width:'100%',background:'#fffaf5',border:'1px solid #ded2c9',borderRadius:18,padding:28,boxShadow:'0 18px 45px rgba(66,43,37,.09)'}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:'#7a3944'}}>RESEARCHFLOW</div>
          <h1 style={{margin:'8px 0 10px'}}>The application hit a startup error.</h1>
          <p style={{lineHeight:1.6}}>The page is no longer silently blank. Read the error below, then check the frontend terminal for the full Vite message.</p>
          <pre style={{whiteSpace:'pre-wrap',background:'#efe7df',padding:16,borderRadius:10,overflow:'auto'}}>{this.state.error?.stack || String(this.state.error)}</pre>
          <button onClick={() => location.reload()} style={{border:0,borderRadius:10,padding:'11px 16px',background:'#7a3944',color:'#fff',fontWeight:700,cursor:'pointer'}}>Reload ResearchFlow</button>
        </div>
      </div>
    )
  }
}
