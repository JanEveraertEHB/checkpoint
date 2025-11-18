import type { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div class="rightContainer">
      <div style={{
        borderBottom: '2px solid #e1e4e8',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          gap: '0'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                color: activeTab === tab.id ? '#000' : '#aaa',
                borderBottom: activeTab === tab.id ? '3px solid #000' : '3px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s ease',
                padding: '0px 50px 0px 10px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}
