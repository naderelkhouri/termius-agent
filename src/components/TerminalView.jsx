import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

export default function TerminalView({ tab, onTitleChange, isActive, onRegisterCommander }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Xterm
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selectionBackground: '#264f78',
        black: '#161b22',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
      },
      allowTransparency: true,
      allowProposedApi: true,
      convertEol: false
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Establish WebSocket Connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      // Send init message
      socket.send(JSON.stringify({
        type: 'init',
        cwd: tab.cwd || '/home/nader',
        cols: term.cols,
        rows: term.rows,
        host: tab.host || null
      }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output') {
          term.write(msg.data);
        } else if (msg.type === 'exit') {
          term.write('\r\n\x1b[33m[Processo finalizado]\x1b[0m\r\n');
        }
      } catch {
        term.write(event.data);
      }
    };

    socket.onclose = () => {
      term.write('\r\n\x1b[31m[Conexão com terminal encerrada]\x1b[0m\r\n');
    };

    // User input to PTY
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Resize handling
    const handleResize = () => {
      if (!fitAddonRef.current || !termRef.current) return;
      fitAddonRef.current.fit();
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'resize',
          cols: termRef.current.cols,
          rows: termRef.current.rows
        }));
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // Expose commander function so snippets and conversation commands can be injected
    if (onRegisterCommander) {
      onRegisterCommander(tab.id, (command) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'input', data: `${command}\n` }));
          term.focus();
        }
      });
    }

    return () => {
      resizeObserver.disconnect();
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      term.dispose();
    };
  }, [tab.id]);

  useEffect(() => {
    if (isActive && fitAddonRef.current && termRef.current) {
      setTimeout(() => {
        fitAddonRef.current.fit();
        termRef.current.focus();
      }, 50);
    }
  }, [isActive]);

  return (
    <div 
      className={`h-full w-full bg-[#0d1117] ${isActive ? 'block' : 'hidden'}`}
      ref={containerRef}
    />
  );
}
