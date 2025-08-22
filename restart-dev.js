const { spawn, exec } = require('child_process');

function killDevServer() {
  return new Promise((resolve) => {
    console.log('🛑 Stopping existing dev server...');
    
    exec('pkill -f "npm run dev"', (error) => {
      if (error) {
        console.log('No existing dev server found (this is fine)');
      } else {
        console.log('✅ Existing dev server stopped');
      }
      setTimeout(resolve, 3000); // Wait 3 seconds for cleanup
    });
  });
}

function startDevServer() {
  console.log('🚀 Starting dev server...');
  
  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'ignore', // Completely ignore stdio to prevent interference
    detached: true
  });
  
  child.unref();
  console.log('✅ Dev server process started');
}

async function restart() {
  console.log('🔄 Restarting dev server...');
  await killDevServer();
  startDevServer();
  
  // Wait for server to start, then open browser
  setTimeout(() => {
    console.log('🌐 Opening browser...');
    exec('open http://localhost:3000');
  }, 5000); // Wait 5 seconds for server to fully start
  
  console.log('✨ Restart initiated!');
}

restart().catch(console.error);