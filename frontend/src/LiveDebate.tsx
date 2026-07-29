import React, { useState, useEffect } from 'react';

interface GIP {
  id: string;
  title: string;
  author: string;
  category: string;
  priority: string;
  summary: string;
  status: string;
  debateThread: GIPMessage[];
}

interface GIPMessage {
  id: string;
  gipId: string;
  agentId: string;
  agentName: string;
  message: string;
  timestamp: number;
  messageType: 'proposal' | 'debate' | 'question' | 'challenge' | 'support' | 'vote' | 'implementation';
  impact: 'low' | 'medium' | 'high';
  reasoning: string;
}

const LiveDebate: React.FC = () => {
  const [activeGIPs, setActiveGIPs] = useState<GIP[]>([]);
  const [selectedGIP, setSelectedGIP] = useState<GIP | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const [showGIPList, setShowGIPList] = useState<boolean>(true);

  const API_BASE = '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchActiveGIPs();
    const interval = setInterval(fetchActiveGIPs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveGIPs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/gip/active`);
      const data = await response.json();
      if (data.success) {
        const gipsWithDebates = data.gips.filter((gip: GIP) => gip.debateThread && gip.debateThread.length > 0);
        setActiveGIPs(gipsWithDebates);
        
        // Auto-select the first GIP with debates if none selected
        if (!selectedGIP && gipsWithDebates.length > 0) {
          setSelectedGIP(gipsWithDebates[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching active GIPs:', error);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'support': return '#CBFA03';
      case 'challenge': return '#ff4444';
      case 'question': return '#ffff00';
      case 'debate': return '#00ffff';
      case 'vote': return '#ff00ff';
      case 'implementation': return '#00aaff';
      default: return '#ffffff';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffff00';
      case 'low': return '#CBFA03';
      default: return '#ffffff';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getAgentTitle = (agentId: string): string => {
    const titles: Record<string, string> = {
      alice: 'ALICE',
      ayra: 'AYRA',
      jarvis: 'JARVIS',
      cortana: 'CORTANA',
      lumina: 'LUMINA',
      nix: 'NIX'
    };
    return titles[agentId] || agentId.toUpperCase();
  };

  const getPhaseFromMessage = (message: GIPMessage): number => {
    // Extract phase from reasoning or message content
    const phaseMatch = message.reasoning.match(/Phase (\d+)/);
    return phaseMatch ? parseInt(phaseMatch[1]) : 1;
  };

  const groupMessagesByPhase = (messages: GIPMessage[]) => {
    const phases: { [key: number]: GIPMessage[] } = {};
    messages.forEach(message => {
      const phase = getPhaseFromMessage(message);
      if (!phases[phase]) phases[phase] = [];
      phases[phase].push(message);
    });
    return phases;
  };

  const getPhaseTitle = (phase: number): string => {
    switch (phase) {
      case 1: return 'PROPOSAL INTRODUCTION & INITIAL REACTIONS';
      case 2: return 'TECHNICAL & ECONOMIC DEEP DIVE';
      case 3: return 'COUNTERARGUMENTS & REFUTATIONS';
      case 4: return 'RISK SCENARIOS & MITIGATIONS';
      case 5: return 'FINAL ARGUMENTS & RECONCILIATION';
      case 6: return 'VOTING PHASE';
      default: return `PHASE ${phase}`;
    }
  };

  const getPhaseColor = (phase: number): string => {
    switch (phase) {
      case 1: return '#CBFA03';
      case 2: return '#00ffff';
      case 3: return '#ff8800';
      case 4: return '#ff4444';
      case 5: return '#ffff00';
      case 6: return '#ff00ff';
      default: return '#ffffff';
    }
  };

  if (activeGIPs.length === 0) {
    return (
      <div style={{
        background: '#000000',
        border: '1px solid #333333',
        padding: '20px',
        marginTop: '20px',
        fontFamily: 'JetBrains Mono, monospace',
        color: '#666666',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        NO ACTIVE DEBATES
      </div>
    );
  }

  const containerStyle = isMaximized ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    background: '#000000',
    border: '2px solid #CBFA03',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: isMobile ? '11px' : '12px',
    display: 'flex',
    flexDirection: 'column' as const
  } : {
    background: '#000000',
    border: '1px solid #333333',
    marginTop: '20px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: isMobile ? '11px' : '12px',
    maxWidth: '100%',
    overflow: 'hidden'
  };

  const contentHeight = isMaximized ? 'calc(100vh - 80px)' : (isMobile ? '500px' : '400px');

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '10px' : '15px',
        borderBottom: '1px solid #333333',
        background: '#000000',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h3 style={{
          margin: 0,
          color: '#CBFA03',
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: 'bold',
          flex: '1'
        }}>
          LIVE ORACLE DEBATES
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '8px' : '15px',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#666666', fontSize: isMobile ? '10px' : '11px' }}>
            {activeGIPs.length} ACTIVE
          </span>
          {isMobile && (
            <button
              onClick={() => setShowGIPList(!showGIPList)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333333',
                color: '#CBFA03',
                padding: '4px 8px',
                fontSize: '9px',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              {showGIPList ? 'HIDE LIST' : 'SHOW LIST'}
            </button>
          )}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              color: '#CBFA03',
              padding: isMobile ? '4px 8px' : '5px 10px',
              fontSize: isMobile ? '9px' : '10px',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            {isMaximized ? 'MINIMIZE' : 'MAXIMIZE'}
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        height: contentHeight,
        overflow: 'hidden'
      }}>
        {/* GIP List */}
        {(!isMobile || showGIPList) && (
          <div style={{
            width: isMobile ? '100%' : (isMaximized ? '400px' : '300px'),
            height: isMobile ? '200px' : '100%',
            borderRight: isMobile ? 'none' : '1px solid #333333',
            borderBottom: isMobile ? '1px solid #333333' : 'none',
            overflow: 'auto',
            background: '#0a0a0a',
            flexShrink: 0
          }}>
          {activeGIPs.map((gip) => (
            <div
              key={gip.id}
              onClick={() => setSelectedGIP(gip)}
              style={{
                padding: '15px',
                borderBottom: '1px solid #333333',
                cursor: 'pointer',
                background: selectedGIP?.id === gip.id ? '#1a1a1a' : 'transparent',
                borderLeft: selectedGIP?.id === gip.id ? '4px solid #CBFA03' : '4px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                color: '#CBFA03',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px',
                lineHeight: '1.3'
              }}>
                {gip.title}
              </div>
              <div style={{
                color: '#cccccc',
                fontSize: '11px',
                marginBottom: '8px',
                lineHeight: '1.4'
              }}>
                {gip.summary.substring(0, isMaximized ? 120 : 80)}...
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                marginBottom: '5px'
              }}>
                <span style={{ color: getPriorityColor(gip.priority) }}>
                  [{gip.priority.toUpperCase()}]
                </span>
                <span style={{ color: '#666666' }}>
                  {gip.debateThread.length} MSGS
                </span>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#888888'
              }}>
                BY: {gip.author.toUpperCase()}
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Debate Thread */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '10px' : '20px',
          background: '#000000',
          width: isMobile ? '100%' : 'auto',
          maxWidth: '100%'
        }}>
          {selectedGIP ? (
            <div>
              {/* GIP Header */}
              <div style={{
                marginBottom: isMobile ? '15px' : '25px',
                padding: isMobile ? '15px' : '20px',
                border: '1px solid #333333',
                background: '#0a0a0a',
                borderRadius: '4px'
              }}>
                <h4 style={{
                  color: '#CBFA03',
                  margin: '0 0 15px 0',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 'bold',
                  wordWrap: 'break-word'
                }}>
                  {selectedGIP.title}
                </h4>
                <div style={{
                  color: '#cccccc',
                  fontSize: isMobile ? '11px' : '12px',
                  lineHeight: '1.5',
                  marginBottom: '15px',
                  wordWrap: 'break-word'
                }}>
                  {selectedGIP.summary}
                </div>
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '8px' : '20px',
                  fontSize: isMobile ? '10px' : '11px',
                  color: '#666666',
                  flexWrap: 'wrap'
                }}>
                  <span>BY: {selectedGIP.author.toUpperCase()}</span>
                  <span>CATEGORY: {selectedGIP.category.toUpperCase()}</span>
                  <span style={{ color: getPriorityColor(selectedGIP.priority) }}>
                    PRIORITY: {selectedGIP.priority.toUpperCase()}
                  </span>
                  <span>STATUS: {selectedGIP.status.toUpperCase()}</span>
                </div>
              </div>

              {/* Debate Messages by Phase */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '25px' }}>
                {Object.entries(groupMessagesByPhase(selectedGIP.debateThread))
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([phase, messages]) => (
                    <div key={phase} style={{
                      border: '1px solid #333333',
                      background: '#0a0a0a',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      {/* Phase Header */}
                      <div style={{
                        background: '#1a1a1a',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        borderBottom: '1px solid #333333'
                      }}>
                        <div style={{
                          color: getPhaseColor(parseInt(phase)),
                          fontWeight: 'bold',
                          fontSize: isMobile ? '12px' : '13px',
                          wordWrap: 'break-word'
                        }}>
                          {getPhaseTitle(parseInt(phase))}
                        </div>
                        <div style={{
                          color: '#666666',
                          fontSize: isMobile ? '9px' : '10px',
                          marginTop: '3px'
                        }}>
                          {messages.length} MESSAGES
                        </div>
                      </div>

                      {/* Phase Messages */}
                      <div style={{ padding: isMobile ? '10px' : '15px' }}>
                        {messages.map((message, index) => (
                          <div key={message.id} style={{
                            border: '1px solid #333333',
                            padding: isMobile ? '12px' : '15px',
                            background: '#000000',
                            marginBottom: index < messages.length - 1 ? (isMobile ? '10px' : '12px') : '0',
                            borderRadius: '3px',
                            wordWrap: 'break-word',
                            overflowWrap: 'anywhere'
                          }}>
                            {/* Message Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: isMobile ? 'flex-start' : 'center',
                              flexDirection: isMobile ? 'column' : 'row',
                              marginBottom: isMobile ? '10px' : '12px',
                              paddingBottom: isMobile ? '6px' : '8px',
                              borderBottom: '1px solid #333333',
                              gap: isMobile ? '5px' : '0'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', flexWrap: 'wrap' }}>
                                <span style={{
                                  color: getMessageTypeColor(message.messageType),
                                  fontWeight: 'bold',
                                  fontSize: isMobile ? '11px' : '12px'
                                }}>
                                  [{getAgentTitle(message.agentId)}]
                                </span>
                                <span style={{
                                  color: '#888888',
                                  fontSize: isMobile ? '9px' : '10px',
                                  padding: '2px 6px',
                                  background: '#1a1a1a',
                                  borderRadius: '2px'
                                }}>
                                  {message.messageType.toUpperCase()}
                                </span>
                              </div>
                              <span style={{
                                color: '#666666',
                                fontSize: isMobile ? '9px' : '10px'
                              }}>
                                {formatTime(message.timestamp)}
                              </span>
                            </div>

                            {/* Message Content */}
                            <div style={{
                              color: '#ffffff',
                              fontSize: isMobile ? '11px' : '12px',
                              lineHeight: '1.6',
                              marginBottom: isMobile ? '10px' : '12px',
                              wordWrap: 'break-word',
                              overflowWrap: 'anywhere'
                            }}>
                              {message.message}
                            </div>

                            {/* Message Footer */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: isMobile ? 'flex-start' : 'center',
                              flexDirection: isMobile ? 'column' : 'row',
                              fontSize: isMobile ? '9px' : '10px',
                              gap: isMobile ? '8px' : '0'
                            }}>
                              <div style={{
                                color: '#666666',
                                fontStyle: 'italic',
                                flex: isMobile ? 'none' : 1,
                                wordWrap: 'break-word',
                                overflowWrap: 'anywhere'
                              }}>
                                Reasoning: {message.reasoning}
                              </div>
                              <span style={{
                                color: '#888888',
                                padding: '2px 6px',
                                background: '#1a1a1a',
                                borderRadius: '2px',
                                flexShrink: 0
                              }}>
                                Impact: {message.impact.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#666666',
              padding: isMobile ? '30px 15px' : '50px',
              fontSize: isMobile ? '12px' : '14px'
            }}>
              {isMobile && !showGIPList ? 'TAP "SHOW LIST" TO SELECT A GIP' : 'SELECT A GIP TO VIEW DEBATE'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveDebate; 