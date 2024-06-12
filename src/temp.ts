import { MidConfig, MidFunc } from ".";
import { _encode } from "./helper";

export function nodemonTemp(watch: string[])
{
  return {
    ext: "ts",
    ignore: [".git", "node_modules/**/node_modules", "./**/*.spec.ts"],
    execMap: {
        ts: "node --require ts-node/register"
    },
    watch: watch
  }
}

export const tsconfigTemp = {
    "compilerOptions": {
        "module": "CommonJS",
        "target": "ES2022",
        "declaration": true,
        "outDir": "./dist",
        "esModuleInterop": true,
        "moduleResolution": "Node",
        "strict": true,
        "skipLibCheck": true,
        "types": ["bun-types", "node"]
    },
    "include": [
        "src/**/*"
    ],
    "exclude": [
        "node_modules",
        "**/node_modules/*",
    ]
};

export const packageTemp = {
    "name": "",
    "version": "1.0.0",
    "description": "",
    "main": "src/index.ts",
    "scripts": {
        "dev": "nodemon --exec bun run src/index.ts",
        "start": "bun src/index.ts",
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
        "middlifier": "^1.0.105",
        "nodemon": "^3.1.0",
        "ts-node": "^10.9.2",
        "typescript": "^5.4.5"
    },
    "types": "dist/index.d.ts",
    "files": [
        "/dist"
    ]    
};

const midConfigJSON: MidConfig = {
    "server": {
      "port": 3000,
      structure: {
        
      }
    },
    "app": {}
  };
  
export const midConfigTempProd = [
    'import { MidConfig } from "middlifier";',
    '',
    `export const config: MidConfig = ${_encode(midConfigJSON)};`,
]

export const indexTempProd = [
    'import { start } from "middlifier";',
    'import { config } from "./mid.config";',
    '',
    'start(config);',
];

export const midConfigTempDev= [
  'import { MidConfig } from "../../src/index";',
  '',
  `export const config: MidConfig = ${_encode(midConfigJSON)};`,
]

export const indexTempDev = [
  'import { start } from "../../src/index";',
  'import { config } from "./mid.config";',
  '',
  'start(config);',
];
