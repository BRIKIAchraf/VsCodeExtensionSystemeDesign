// The module 'vscode' contains the VS Code extensibility API
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function activate(context) {
    console.log('Congratulations, your extension "systeme-design-helper" is now active!');

    const createMicroservicesCommand = vscode.commands.registerCommand('systeme-design-helper.createMicroservices', async function () {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Select Folder to Create Microservices',
        });

        if (folderUri && folderUri.length > 0) {
            const basePath = folderUri[0].fsPath;

            // Select theme
            const theme = await vscode.window.showQuickPick(['REST API', 'GraphQL'], {
                placeHolder: 'Select a project theme',
            });

            // Select packages
            const packages = await vscode.window.showQuickPick(['Express', 'Mongoose', 'JWT', 'Cors'], {
                placeHolder: 'Select packages to install',
                canPickMany: true,
            });

            // Select middleware
            const middlewares = await vscode.window.showQuickPick(['body-parser', 'morgan', 'helmet'], {
                placeHolder: 'Select middleware to include',
                canPickMany: true,
            });

            // Select architecture
            const architecture = await vscode.window.showQuickPick(['Monolith', 'Microservices'], {
                placeHolder: 'Select architecture',
            });

            // Select database
            const database = await vscode.window.showQuickPick(['MongoDB', 'PostgreSQL', 'MySQL'], {
                placeHolder: 'Select database',
            });

            // Select testing framework
            const testingFramework = await vscode.window.showQuickPick(['Mocha', 'Jest'], {
                placeHolder: 'Select testing framework (optional)',
                canPickMany: false,
            });

            // Select UI framework
            const uiFramework = await vscode.window.showQuickPick(['Tailwind CSS', 'Material-UI'], {
                placeHolder: 'Select a UI framework (optional)',
                canPickMany: false,
            });

            createMicroservicesStructure(basePath, theme, packages, middlewares, architecture, database, testingFramework, uiFramework);
            await installPackages(basePath, packages);
            vscode.window.showInformationMessage('Microservices architecture created successfully!');
        }
    });

    const openDrawingBoardCommand = vscode.commands.registerCommand('systeme-design-helper.openDrawingBoard', function () {
        const panel = vscode.window.createWebviewPanel(
            'drawingBoard',
            'Drawing Board',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();
    });

    context.subscriptions.push(createMicroservicesCommand, openDrawingBoardCommand);
}

function createMicroservicesStructure(basePath, theme, packages, middlewares, architecture, database, testingFramework, uiFramework) {
    const services = architecture === 'Microservices' ? ['service1', 'service2'] : ['monolith'];

    services.forEach(service => {
        const servicePath = path.join(basePath, service);
        fs.mkdirSync(servicePath, { recursive: true });
        fs.mkdirSync(path.join(servicePath, 'controllers'), { recursive: true });
        fs.mkdirSync(path.join(servicePath, 'models'), { recursive: true });
        fs.mkdirSync(path.join(servicePath, 'routes'), { recursive: true });
        fs.mkdirSync(path.join(servicePath, 'middlewares'), { recursive: true });
        fs.mkdirSync(path.join(servicePath, 'config'), { recursive: true });
        fs.mkdirSync(path.join(servicePath, 'services'), { recursive: true });

        // Create configuration files
        createConfigFiles(servicePath, database);

        // Create a basic index.js file
        const indexContent = generateIndexContent(theme, database, middlewares);
        fs.writeFileSync(path.join(servicePath, 'index.js'), indexContent);

        // Create a sample controller
        fs.writeFileSync(path.join(servicePath, 'controllers', 'sampleController.js'), generateSampleController());

        // Create a sample route
        fs.writeFileSync(path.join(servicePath, 'routes', 'sampleRoute.js'), generateSampleRoute());

        // Create a sample model if using a database
        if (database) {
            fs.writeFileSync(path.join(servicePath, 'models', 'sampleModel.js'), generateSampleModel(database));
        }

        // Create a test file if a testing framework is selected
        if (testingFramework) {
            fs.mkdirSync(path.join(servicePath, 'tests'), { recursive: true });
            fs.writeFileSync(path.join(servicePath, 'tests', 'sampleController.test.js'), generateTestFile(testingFramework));
        }

        // Handle UI framework setup
        if (uiFramework) {
            setupUIFramework(servicePath, uiFramework);
        }
    });

    const commonPath = path.join(basePath, 'common');
    fs.mkdirSync(commonPath, { recursive: true });

    // Create Dockerfile and docker-compose.yml
    createDockerFiles(basePath);
}

function setupUIFramework(servicePath, uiFramework) {
    if (uiFramework === 'Tailwind CSS') {
        // Install Tailwind CSS and create configuration
        const tailwindConfig = `module.exports = {
            purge: ['./views/**/*.html', './src/**/*.{js,jsx,ts,tsx}'],
            darkMode: false,
            theme: {
                extend: {},
            },
            variants: {
                extend: {},
            },
            plugins: [],
        };`;
        
        fs.writeFileSync(path.join(servicePath, 'tailwind.config.js'), tailwindConfig);
        
        // Add Tailwind to CSS
        const cssContent = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;
        fs.mkdirSync(path.join(servicePath, 'styles'), { recursive: true });
        fs.writeFileSync(path.join(servicePath, 'styles', 'tailwind.css'), cssContent);
        
    } else if (uiFramework === 'Material-UI') {
        // Install Material-UI and create sample component
        const sampleComponent = `import React from 'react';
import Button from '@material-ui/core/Button';

export default function SampleButton() {
    return <Button variant="contained" color="primary">Sample Button</Button>;
};`;
        
        fs.mkdirSync(path.join(servicePath, 'components'), { recursive: true });
        fs.writeFileSync(path.join(servicePath, 'components', 'SampleButton.js'), sampleComponent);
    }
}

function createConfigFiles(servicePath, database) {
    const envContent = `# Environment Variables
PORT=3000
DB_URL=YOUR_DATABASE_URL_HERE
`;
    fs.writeFileSync(path.join(servicePath, '.env'), envContent);
}

function generateIndexContent(theme, database, middlewares) {
    let dbConnection = '';
    if (database === 'MongoDB') {
        dbConnection = `const mongoose = require('mongoose');\nmongoose.connect(process.env.DB_URL);\n`;
    } else if (database === 'PostgreSQL') {
        dbConnection = `const { Client } = require('pg');\nconst client = new Client({ connectionString: process.env.DB_URL });\nclient.connect();\n`;
    }

    const middlewareImports = middlewares.map(m => `const ${m} = require('${m}');`).join('\n');
    const middlewareUsage = middlewares.map(m => `app.use(${m}());`).join('\n');

    return `
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

${middlewareImports}
${dbConnection}

app.use(express.json());
${middlewareUsage}
app.use('/api', require('./routes/sampleRoute'));

app.listen(PORT, () => {
    console.log(\`Service running on port \${PORT}\`);
});`;
}

function generateSampleController() {
    return `
exports.getSample = (req, res) => {
    res.send('Sample data');
};`;
}

function generateSampleRoute() {
    return `
const express = require('express');
const router = express.Router();
const sampleController = require('../controllers/sampleController');

router.get('/sample', sampleController.getSample);

module.exports = router;`;
}

function generateSampleModel(database) {
    if (database === 'MongoDB') {
        return `
const mongoose = require('mongoose');

const SampleSchema = new mongoose.Schema({
    name: String,
    age: Number
});

module.exports = mongoose.model('Sample', SampleSchema);`;
    } else if (database === 'PostgreSQL') {
        return `
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DB_URL });
client.connect();
`;
    }
    return '';
}

function generateTestFile(testingFramework) {
    if (testingFramework === 'Mocha') {
        return `
const request = require('supertest');
const app = require('../index');

describe('GET /api/sample', () => {
    it('should return sample data', (done) => {
        request(app)
            .get('/api/sample')
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, res) => {
                if (err) return done(err);
                done();
            });
    });
});`;
    } else if (testingFramework === 'Jest') {
        return `
const request = require('supertest');
const app = require('../index');

test('GET /api/sample', async () => {
    const response = await request(app).get('/api/sample');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
});`;
    }
    return '';
}

function createDockerFiles(basePath) {
    // Dockerfile
    const dockerfileContent = `
FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./ 
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
`;
    fs.writeFileSync(path.join(basePath, 'Dockerfile'), dockerfileContent);

    // docker-compose.yml
    const dockerComposeContent = `
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
`;
    fs.writeFileSync(path.join(basePath, 'docker-compose.yml'), dockerComposeContent);
}

function installPackages(basePath, packages) {
    if (packages && packages.length > 0) {
        return new Promise((resolve, reject) => {
            const packageList = packages.join(' ');
            exec(`npm install ${packageList}`, { cwd: basePath }, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error installing packages: ${stderr}`);
                    return;
                }
                console.log(stdout);
                resolve();
            });
        });
    }
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Drawing Board</title>
        <style>
            body { margin: 0; display: flex; height: 100vh; transition: background 0.3s, color 0.3s; }
            .light-mode { background: #ffffff; color: #000; }
            .dark-mode { background: #333; color: #fff; }
            .toolbar { background: #f0f0f0; padding: 10px; display: flex; justify-content: space-between; }
            .sidebar { width: 150px; background: #f9f9f9; padding: 10px; display: flex; flex-direction: column; }
            .sidebar h3 { cursor: pointer; }
            .item { margin-bottom: 10px; cursor: pointer; }
            canvas { border: 1px solid black; cursor: crosshair; flex: 1; }
            .toggle-button { margin-left: auto; cursor: pointer; }
        </style>
    </head>
    <body class="light-mode">
        <div class="toolbar">
            <span class="toggle-button">🌙</span>
        </div>
        <div class="sidebar">
            <h3 onclick="toggleCategory('frameworks')">Frameworks</h3>
            <div id="frameworks" class="category" style="display: none;">
                <div class="item" draggable="true" data-name="React.js">React.js</div>
                <div class="item" draggable="true" data-name="Express.js">Express.js</div>
            </div>
            <h3 onclick="toggleCategory('cloud')">Cloud Providers</h3>
            <div id="cloud" class="category" style="display: none;">
                <div class="item" draggable="true" data-name="AWS">AWS</div>
                <div class="item" draggable="true" data-name="Azure">Azure</div>
            </div>
            <h3 onclick="toggleCategory('devops')">DevOps</h3>
            <div id="devops" class="category" style="display: none;">
                <div class="item" draggable="true" data-name="Docker">Docker</div>
                <div class="item" draggable="true" data-name="Kubernetes">Kubernetes</div>
            </div>
            <h3 onclick="toggleCategory('architect')">Architectures</h3>
            <div id="architect" class="category" style="display: none;">
                <div class="item" draggable="true" data-name="Microservices">Microservices</div>
                <div class="item" draggable="true" data-name="Monolith">Monolith</div>
            </div>
        </div>
        <canvas id="drawingCanvas" width="800" height="600"></canvas>
        <script>
            function toggleCategory(category) {
                const catDiv = document.getElementById(category);
                catDiv.style.display = catDiv.style.display === 'none' ? 'block' : 'none';
            }

            document.querySelectorAll('.item').forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', e.target.dataset.name);
                });
            });

            const canvas = document.getElementById('drawingCanvas');
            const ctx = canvas.getContext('2d');
            let isDrawing = false;

            canvas.addEventListener('mousedown', () => {
                isDrawing = true;
                ctx.beginPath();
            });

            canvas.addEventListener('mouseup', () => {
                isDrawing = false;
                ctx.closePath();
            });

            canvas.addEventListener('mousemove', (e) => {
                if (!isDrawing) return;
                ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
                ctx.stroke();
            });

            const toggleButton = document.querySelector('.toggle-button');
            toggleButton.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
            });
        </script>
    </body>
    </html>`;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
