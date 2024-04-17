import { MidConfig } from ".";

export const nodemonTemp = {
    ext: "ts",
    ignore: [".git", "node_modules/**/node_modules", "./**/*.spec.ts"],
    execMap: {
        ts: "node --require ts-node/register"
    },
    watch: ["./src"]
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
        "build": "npx tsc",
        "dev": "npx nodemon src/index.ts",
        "start": "node dist/index.js"
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
    server: {
        port: 4000,
    },
    app: {

    }
}

export const midConfigTemp = [
    'import { MidConfig } from "middlifier";',
    '',
    `export const config: MidConfig = ${JSON.stringify(midConfigJSON, null, 2).replace(/\\/g, '\\\\')};`,
]

export const indexTemp = [
    'import { start } from "middlifier";',
    'import { config } from "./mid.config";',
    '',
    'start(config);',
];
