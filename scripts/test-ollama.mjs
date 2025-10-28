/**
 * Test script to verify Ollama connectivity and model availability
 * Run with: node scripts/test-ollama.mjs
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

console.log('🤖 Testing Ollama Connection...\n');
console.log(`Base URL: ${OLLAMA_BASE_URL}`);
console.log(`Model: ${OLLAMA_MODEL}\n`);

/**
 * Test Ollama health
 */
async function testHealth() {
    console.log('📡 Testing Ollama health endpoint...');
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Ollama is running!');
        console.log(`📦 Available models: ${data.models.length}`);

        if (data.models.length > 0) {
            console.log('\nInstalled models:');
            data.models.forEach(model => {
                console.log(`  - ${model.name}`);
            });
        }

        return { success: true, models: data.models };
    } catch (error) {
        console.error('❌ Failed to connect to Ollama:');
        console.error(`   ${error.message}`);
        console.error('\nTroubleshooting:');
        console.error('   1. Make sure Ollama is installed and running on Windows');
        console.error('   2. Check that Ollama is accessible at http://localhost:11434');
        console.error('   3. Verify Docker container can reach host via host.docker.internal');
        return { success: false, models: [] };
    }
}

/**
 * Test model availability
 */
async function testModelAvailability(models) {
    console.log(`\n🔍 Checking if model "${OLLAMA_MODEL}" is available...`);

    const modelExists = models.some(m => m.name.includes(OLLAMA_MODEL));

    if (modelExists) {
        console.log(`✅ Model "${OLLAMA_MODEL}" is installed!`);
        return true;
    } else {
        console.error(`❌ Model "${OLLAMA_MODEL}" is NOT installed.`);
        console.error('\nTo install the model, run on your Windows host:');
        console.error(`   ollama pull ${OLLAMA_MODEL}`);
        console.error('\nRecommended models:');
        console.error('   - llama3.2     (recommended, balanced performance)');
        console.error('   - llama3.1     (larger, more capable)');
        console.error('   - mistral      (fast and efficient)');
        console.error('   - qwen2.5      (good for Chinese + English)');
        return false;
    }
}

/**
 * Test simple generation
 */
async function testGeneration() {
    console.log(`\n🧪 Testing text generation with "${OLLAMA_MODEL}"...`);

    const testPrompt = 'Say hello in exactly 5 words.';

    try {
        console.log(`Prompt: "${testPrompt}"`);
        console.log('⏳ Generating response (this may take a moment)...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: testPrompt,
                stream: false,
                options: {
                    temperature: 0.7,
                }
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();

        if (!data.response) {
            throw new Error('Ollama returned empty response');
        }

        console.log('✅ Generation successful!');
        console.log(`Response: "${data.response.trim()}"`);
        console.log(`\n📊 Stats:`);
        console.log(`   Total duration: ${(data.total_duration / 1e9).toFixed(2)}s`);
        if (data.eval_count && data.eval_duration) {
            console.log(`   Tokens generated: ${data.eval_count}`);
            console.log(`   Speed: ${(data.eval_count / (data.eval_duration / 1e9)).toFixed(2)} tokens/sec`);
        }

        return true;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ Request timeout after 30 seconds');
            console.error('   The model might be too slow or not responding.');
        } else {
            console.error('❌ Generation failed:');
            console.error(`   ${error.message}`);
        }
        return false;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('═══════════════════════════════════════════════════\n');

    // Test 1: Health check
    const healthResult = await testHealth();

    if (!healthResult.success) {
        console.log('\n═══════════════════════════════════════════════════');
        console.log('❌ Ollama health check failed. Fix the connection first.\n');
        process.exit(1);
    }

    // Test 2: Model availability
    const modelAvailable = await testModelAvailability(healthResult.models);

    if (!modelAvailable) {
        console.log('\n═══════════════════════════════════════════════════');
        console.log(`❌ Model "${OLLAMA_MODEL}" not found. Install it first.\n`);
        process.exit(1);
    }

    // Test 3: Simple generation
    const generationSuccess = await testGeneration();

    console.log('\n═══════════════════════════════════════════════════');

    if (generationSuccess) {
        console.log('✅ All tests passed! Ollama is ready to use.\n');
        process.exit(0);
    } else {
        console.log('❌ Generation test failed. Check the errors above.\n');
        process.exit(1);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('\n❌ Unexpected error:');
    console.error(error);
    process.exit(1);
});
