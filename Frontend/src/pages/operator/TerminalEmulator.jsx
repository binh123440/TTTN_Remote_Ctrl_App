// TerminalEmulator.jsx
import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

const TerminalEmulator = ({ deviceId, username, password, ip, port, userId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    // Initialize terminal
    xtermRef.current = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#300A24', // Ubuntu terminal purple
        foreground: '#FFFFFF',
        cursor: '#FFFFFF',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#2E3436',
        brightBlack: '#555753',
        red: '#CC0000',
        brightRed: '#EF2929',
        green: '#4E9A06',
        brightGreen: '#8AE234',
        yellow: '#C4A000',
        brightYellow: '#FCE94F',
        blue: '#3465A4',
        brightBlue: '#729FCF',
        magenta: '#75507B',
        brightMagenta: '#AD7FA8',
        cyan: '#06989A',
        brightCyan: '#34E2E2',
        white: '#D3D7CF',
        brightWhite: '#EEEEEC'
      },
      fontFamily: 'Ubuntu Mono, courier-new, courier, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      convertEol: true
    });

    // Add fit addon
    fitAddonRef.current = new FitAddon();
    xtermRef.current.loadAddon(fitAddonRef.current);

    // Add web links addon
    const webLinksAddon = new WebLinksAddon();
    xtermRef.current.loadAddon(webLinksAddon);

    // Open terminal in the container
    xtermRef.current.open(terminalRef.current);
    
    // Fit terminal to container
    setTimeout(() => {
      fitAddonRef.current.fit();
    }, 100);

    // Connect to WebSocket
    const connectWebSocket = () => {
      const socket = new WebSocket(`ws://localhost:8000/ws/terminal/${deviceId}`);
      socketRef.current = socket;

      // Add token to connection data
      const token = localStorage.getItem('accessToken');

      socket.onopen = () => {
        // Send connection details including the token
        socket.send(JSON.stringify({
          username,
          password,
          ip,
          port,
          user_id: userId,
          token: token  // Send the token for authentication
        }));

        // Display connecting message
        xtermRef.current.writeln('\x1b[1;32mConnecting to SSH server...\x1b[0m');
      };

      socket.onmessage = (event) => {
        try {
          // Check if it's a text message or JSON
          if (typeof event.data === 'string' && (event.data.startsWith('{') || event.data.startsWith('['))) {
            const jsonData = JSON.parse(event.data);
            if (jsonData.type === 'error') {
              xtermRef.current.writeln(`\x1b[1;31mError: ${jsonData.message}\x1b[0m`);
            } else if (jsonData.type === 'session_start') {
              xtermRef.current.writeln('\x1b[1;32mConnected to SSH server!\x1b[0m\n');
            }
          } else {
            // Regular terminal output
            xtermRef.current.write(event.data);
          }
        } catch (e) {
          // If not JSON, just write the data
          xtermRef.current.write(event.data);
        }
      };

      socket.onclose = () => {
        xtermRef.current.writeln('\n\x1b[1;31mConnection closed\x1b[0m');
      };

      socket.onerror = (error) => {
        xtermRef.current.writeln(`\n\x1b[1;31mWebSocket error: ${error.message}\x1b[0m`);
      };

      // Handle terminal input
      xtermRef.current.onData(data => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });

      // Handle resize
      const handleResize = () => {
        fitAddonRef.current.fit();
        const dimensions = fitAddonRef.current.proposeDimensions();
        if (dimensions && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'resize',
            cols: dimensions.cols,
            rows: dimensions.rows
          }));
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    };

    const cleanup = connectWebSocket();

    // Clean up on unmount
    return () => {
      if (cleanup) cleanup();
      if (socketRef.current) socketRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
    };
  }, [deviceId, username, password, ip, port, userId]);

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        height: '400px', 
        width: '100%', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '4px'
      }} 
    />
  );
};

export default TerminalEmulator;