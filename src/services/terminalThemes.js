// Definições de temas e configurações visuais do terminal para Termius Agent
export const TERMINAL_THEMES = [
  {
    id: 'github_dark',
    name: 'GitHub Dark',
    description: 'Padrão do GitHub com tons frios de azul e slate escuro',
    author: 'GitHub',
    previewColors: ['#0d1117', '#58a6ff', '#3fb950', '#ff7b72', '#c9d1d9'],
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
      brightWhite: '#f0f6fc'
    }
  },
  {
    id: 'termius_midnight',
    name: 'Termius Midnight (OLED)',
    description: 'Preto puro com acentos vibrantes em ciano e esmeralda',
    author: 'Termius Suite',
    previewColors: ['#080a0f', '#00f0ff', '#10b981', '#f43f5e', '#e2e8f0'],
    theme: {
      background: '#080a0f',
      foreground: '#e2e8f0',
      cursor: '#00f0ff',
      cursorAccent: '#080a0f',
      selectionBackground: '#1e293b',
      black: '#0f172a',
      red: '#f43f5e',
      green: '#10b981',
      yellow: '#f59e0b',
      blue: '#06b6d4',
      magenta: '#a855f7',
      cyan: '#00f0ff',
      white: '#f8fafc',
      brightBlack: '#475569',
      brightRed: '#fb7185',
      brightGreen: '#34d399',
      brightYellow: '#fbbf24',
      brightBlue: '#38bdf8',
      brightMagenta: '#c084fc',
      brightCyan: '#67e8f9',
      brightWhite: '#ffffff'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'Tema gótico escuro clássico com tons roxo e pastel',
    author: 'Zeno Rocha',
    previewColors: ['#282a36', '#bd93f9', '#50fa7b', '#ff79c6', '#f8f8f2'],
    theme: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#bd93f9',
      cursorAccent: '#282a36',
      selectionBackground: '#44475a',
      black: '#21222c',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
      brightBlack: '#6272a4',
      brightRed: '#ff6e6e',
      brightGreen: '#69ff94',
      brightYellow: '#ffffa5',
      brightBlue: '#d6acff',
      brightMagenta: '#ff92df',
      brightCyan: '#a4ffff',
      brightWhite: '#ffffff'
    }
  },
  {
    id: 'monokai_pro',
    name: 'Monokai Pro',
    description: 'Paleta balanceada de alto contraste focada em legibilidade prolongada',
    author: 'Monokai',
    previewColors: ['#2d2a2e', '#ffd866', '#a9dc76', '#ff6188', '#fcfcfa'],
    theme: {
      background: '#2d2a2e',
      foreground: '#fcfcfa',
      cursor: '#ffd866',
      cursorAccent: '#2d2a2e',
      selectionBackground: '#403e41',
      black: '#403e41',
      red: '#ff6188',
      green: '#a9dc76',
      yellow: '#ffd866',
      blue: '#fc9867',
      magenta: '#ab9df2',
      cyan: '#78dce8',
      white: '#fcfcfa',
      brightBlack: '#727072',
      brightRed: '#ff6188',
      brightGreen: '#a9dc76',
      brightYellow: '#ffd866',
      brightBlue: '#fc9867',
      brightMagenta: '#ab9df2',
      brightCyan: '#78dce8',
      brightWhite: '#ffffff'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'Paleta inspirada na estética do círculo ártico com tons frios e azul pastel',
    author: 'Arctic Ice Studio',
    previewColors: ['#2e3440', '#88c0d0', '#a3be8c', '#bf616a', '#d8dee9'],
    theme: {
      background: '#2e3440',
      foreground: '#d8dee9',
      cursor: '#88c0d0',
      cursorAccent: '#2e3440',
      selectionBackground: '#434c5e',
      black: '#3b4252',
      red: '#bf616a',
      green: '#a3be8c',
      yellow: '#ebcb8b',
      blue: '#81a1c1',
      magenta: '#b48ead',
      cyan: '#88c0d0',
      white: '#e5e9f0',
      brightBlack: '#4c566a',
      brightRed: '#bf616a',
      brightGreen: '#a3be8c',
      brightYellow: '#ebcb8b',
      brightBlue: '#81a1c1',
      brightMagenta: '#b48ead',
      brightCyan: '#8fbcbb',
      brightWhite: '#eceff4'
    }
  },
  {
    id: 'one_dark',
    name: 'One Dark Pro',
    description: 'O famoso tema icônico do Atom e VS Code com harmonia e contraste suave',
    author: 'Atom',
    previewColors: ['#1e1e1e', '#61afef', '#98c379', '#e06c75', '#abb2bf'],
    theme: {
      background: '#1e1e1e',
      foreground: '#abb2bf',
      cursor: '#528bff',
      cursorAccent: '#1e1e1e',
      selectionBackground: '#3e4451',
      black: '#282c34',
      red: '#e06c75',
      green: '#98c379',
      yellow: '#e5c07b',
      blue: '#61afef',
      magenta: '#c678dd',
      cyan: '#56b6c2',
      white: '#abb2bf',
      brightBlack: '#5c6370',
      brightRed: '#e06c75',
      brightGreen: '#98c379',
      brightYellow: '#e5c07b',
      brightBlue: '#61afef',
      brightMagenta: '#c678dd',
      brightCyan: '#56b6c2',
      brightWhite: '#ffffff'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Estética futurista retro-synthwave com amarelo neon e magenta elétrico',
    author: 'Night City',
    previewColors: ['#0d0d16', '#ffe600', '#00ffc2', '#ff0055', '#ffffff'],
    theme: {
      background: '#0d0d16',
      foreground: '#00ffc2',
      cursor: '#ffe600',
      cursorAccent: '#0d0d16',
      selectionBackground: '#391c45',
      black: '#1a1a2e',
      red: '#ff0055',
      green: '#00ff9f',
      yellow: '#ffe600',
      blue: '#00b8ff',
      magenta: '#ff00d4',
      cyan: '#00ffc2',
      white: '#ffffff',
      brightBlack: '#666680',
      brightRed: '#ff3377',
      brightGreen: '#33ffb2',
      brightYellow: '#ffeb33',
      brightBlue: '#33c6ff',
      brightMagenta: '#ff33dd',
      brightCyan: '#33ffce',
      brightWhite: '#ffffff'
    }
  },
  {
    id: 'solarized_dark',
    name: 'Solarized Dark',
    description: 'Esquema de cores ergonomicamente balanceado baseado em teorias de luminosidade',
    author: 'Ethan Schoonover',
    previewColors: ['#002b36', '#268bd2', '#859900', '#dc322f', '#839496'],
    theme: {
      background: '#002b36',
      foreground: '#839496',
      cursor: '#93a1a1',
      cursorAccent: '#002b36',
      selectionBackground: '#073642',
      black: '#073642',
      red: '#dc322f',
      green: '#859900',
      yellow: '#b58900',
      blue: '#268bd2',
      magenta: '#d33682',
      cyan: '#2aa198',
      white: '#eee8d5',
      brightBlack: '#002b36',
      brightRed: '#cb4b16',
      brightGreen: '#586e75',
      brightYellow: '#657b83',
      brightBlue: '#839496',
      brightMagenta: '#6c71c4',
      brightCyan: '#93a1a1',
      brightWhite: '#fdf6e3'
    }
  }
];

export const DEFAULT_TERMINAL_SETTINGS = {
  themeId: 'github_dark',
  fontSize: 13,
  cursorStyle: 'block', // 'block' | 'underline' | 'bar'
  cursorBlink: true,
  lineHeight: 1.25,
  fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace'
};

export const FONT_SIZE_OPTIONS = [12, 13, 14, 16, 18];

export const CURSOR_STYLE_OPTIONS = [
  { id: 'block', label: 'Bloco Sólido', symbol: '█' },
  { id: 'bar', label: 'Linha Vertical', symbol: '❙' },
  { id: 'underline', label: 'Sublinhado', symbol: ' ' }
];

export function getThemeDefinition(themeId) {
  const match = TERMINAL_THEMES.find((t) => t.id === themeId);
  return (match ? match.theme : TERMINAL_THEMES[0].theme);
}

export function loadTerminalSettings() {
  try {
    const raw = localStorage.getItem('termius_terminal_theme_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_TERMINAL_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('[TerminalThemes] Erro ao carregar configurações de tema:', e);
  }
  return DEFAULT_TERMINAL_SETTINGS;
}

export function saveTerminalSettings(settings) {
  try {
    localStorage.setItem('termius_terminal_theme_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('[TerminalThemes] Erro ao salvar configurações de tema:', e);
  }
}
