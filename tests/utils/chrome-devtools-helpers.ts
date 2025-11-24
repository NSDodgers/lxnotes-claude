/**
 * Chrome DevTools MCP Integration Helpers for LX Notes Testing
 *
 * Provides conditional integration with Chrome DevTools MCP capabilities
 * while maintaining compatibility with standard Playwright testing.
 *
 * Usage:
 *   const cdtHelpers = new ChromeDevToolsHelpers(page);
 *   const isEnabled = await cdtHelpers.isAvailable();
 *   if (isEnabled) {
 *     await cdtHelpers.startPerformanceTrace();
 *   }
 */

import { Page, BrowserContext } from '@playwright/test';

export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  fcp?: number;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
  type: string;
}

export interface ConsoleMessage {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  text: string;
  timestamp: number;
  source?: string;
}

export class ChromeDevToolsHelpers {
  private page: Page;
  private context: BrowserContext;
  private isEnabled: boolean | null = null;
  private performanceTraceActive = false;

  constructor(page: Page) {
    this.page = page;
    this.context = page.context();
  }

  /**
   * Check if Chrome DevTools MCP is available and enabled
   */
  async isAvailable(): Promise<boolean> {
    if (this.isEnabled !== null) {
      return this.isEnabled;
    }

    // Check environment variable
    const enabled = process.env.ENABLE_CHROME_DEVTOOLS_MCP === 'true';

    if (!enabled) {
      this.isEnabled = false;
      return false;
    }

    // Verify MCP tools are actually available
    try {
      // This would typically check for MCP tool availability
      // For now, we'll use the environment flag as the indicator
      this.isEnabled = true;
      return true;
    } catch (error) {
      console.warn('Chrome DevTools MCP appears enabled but tools unavailable:', error);
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * Start performance monitoring and trace recording
   */
  async startPerformanceTrace(): Promise<void> {
    if (!(await this.isAvailable())) {
      console.warn('Chrome DevTools MCP not available, skipping performance trace');
      return;
    }

    try {
      // This would use MCP tools when available
      // For now, provide standard Playwright alternative
      await this.page.route('**/*', route => {
        route.continue();
      });

      this.performanceTraceActive = true;
      console.log('Performance monitoring started (Playwright mode)');
    } catch (error) {
      console.error('Failed to start performance trace:', error);
    }
  }

  /**
   * Stop performance trace and return metrics
   */
  async stopPerformanceTrace(): Promise<PerformanceMetrics> {
    if (!this.performanceTraceActive) {
      return {};
    }

    try {
      if (await this.isAvailable()) {
        // Future: Use Chrome DevTools MCP for detailed metrics
        console.log('Stopping performance trace (Chrome DevTools MCP mode)');
      }

      // Fallback: Use Playwright's built-in performance metrics
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');

        const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime;
        const lcp = (window as any).largestContentfulPaint?.startTime;

        return {
          ttfb: navigation?.responseStart - navigation?.requestStart,
          fcp,
          lcp,
          // Note: FID and CLS require more complex measurement
        };
      });

      this.performanceTraceActive = false;
      return metrics;
    } catch (error) {
      console.error('Failed to stop performance trace:', error);
      return {};
    }
  }

  /**
   * Monitor network requests during test execution
   */
  async getNetworkRequests(): Promise<NetworkRequest[]> {
    try {
      if (await this.isAvailable()) {
        // Future: Use Chrome DevTools MCP for detailed network analysis
        console.log('Getting network requests (Chrome DevTools MCP mode)');
        return [];
      }

      // Fallback: Use Playwright's network monitoring
      const requests: NetworkRequest[] = [];

      this.page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          status: 0, // Will be updated on response
          duration: 0,
          size: 0,
          type: request.resourceType()
        });
      });

      this.page.on('response', response => {
        const matchingRequest = requests.find(req =>
          req.url === response.url() && req.status === 0
        );
        if (matchingRequest) {
          matchingRequest.status = response.status();
        }
      });

      return requests;
    } catch (error) {
      console.error('Failed to get network requests:', error);
      return [];
    }
  }

  /**
   * Capture console messages and errors
   */
  async getConsoleMessages(): Promise<ConsoleMessage[]> {
    try {
      if (await this.isAvailable()) {
        // Future: Use Chrome DevTools MCP for enhanced console analysis
        console.log('Getting console messages (Chrome DevTools MCP mode)');
        return [];
      }

      // Fallback: Use Playwright's console monitoring
      const messages: ConsoleMessage[] = [];

      this.page.on('console', msg => {
        messages.push({
          level: msg.type() as any,
          text: msg.text(),
          timestamp: Date.now(),
          source: msg.location()?.url
        });
      });

      return messages;
    } catch (error) {
      console.error('Failed to get console messages:', error);
      return [];
    }
  }

  /**
   * Take enhanced screenshot with Chrome DevTools capabilities
   */
  async takeEnhancedScreenshot(options: {
    filename?: string;
    fullPage?: boolean;
    element?: string;
    quality?: number;
  } = {}): Promise<Buffer | null> {
    try {
      if (await this.isAvailable()) {
        // Future: Use Chrome DevTools MCP for enhanced screenshots
        console.log('Taking enhanced screenshot (Chrome DevTools MCP mode)');
      }

      // Fallback: Use standard Playwright screenshot
      return await this.page.screenshot({
        path: options.filename,
        fullPage: options.fullPage,
        quality: options.quality,
        type: 'png'
      });
    } catch (error) {
      console.error('Failed to take enhanced screenshot:', error);
      return null;
    }
  }

  /**
   * Execute JavaScript with enhanced debugging capabilities
   */
  async evaluateWithDebugging<T>(
    expression: string | Function,
    arg?: any
  ): Promise<T | null> {
    try {
      if (await this.isAvailable()) {
        // Future: Use Chrome DevTools MCP for enhanced debugging
        console.log('Evaluating with enhanced debugging (Chrome DevTools MCP mode)');
      }

      // Fallback: Use standard Playwright evaluation
      return await this.page.evaluate(expression as any, arg);
    } catch (error) {
      console.error('Failed to evaluate with debugging:', error);
      return null;
    }
  }

  /**
   * Wait for specific conditions with enhanced monitoring
   */
  async waitForConditionWithMonitoring(
    condition: string,
    options: {
      timeout?: number;
      monitorPerformance?: boolean;
      monitorNetwork?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      const timeout = options.timeout || 30000;

      if (await this.isAvailable()) {
        // Future: Use Chrome DevTools MCP for enhanced waiting
        console.log('Waiting with enhanced monitoring (Chrome DevTools MCP mode)');
      }

      // Fallback: Use standard Playwright waiting
      await this.page.waitForFunction(condition, {}, { timeout });
      return true;
    } catch (error) {
      console.error('Failed to wait for condition:', error);
      return false;
    }
  }

  /**
   * Generate comprehensive test report with all captured data
   */
  async generateTestReport(): Promise<{
    performance: PerformanceMetrics;
    network: NetworkRequest[];
    console: ConsoleMessage[];
    errors: string[];
  }> {
    const performance = this.performanceTraceActive
      ? await this.stopPerformanceTrace()
      : {};

    const network = await this.getNetworkRequests();
    const console = await this.getConsoleMessages();

    const errors = console
      .filter(msg => msg.level === 'error')
      .map(msg => msg.text);

    return {
      performance,
      network,
      console,
      errors
    };
  }
}

/**
 * Utility function to create Chrome DevTools helpers for a test
 */
export function createChromeDevToolsHelpers(page: Page): ChromeDevToolsHelpers {
  return new ChromeDevToolsHelpers(page);
}

/**
 * Test decorator to conditionally enable Chrome DevTools MCP features
 */
export function withChromeDevTools() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const isEnabled = process.env.ENABLE_CHROME_DEVTOOLS_MCP === 'true';

      if (isEnabled) {
        console.log(`Running ${propertyName} with Chrome DevTools MCP enabled`);
      } else {
        console.log(`Running ${propertyName} with standard Playwright (Chrome DevTools MCP disabled)`);
      }

      return method.apply(this, args);
    };

    return descriptor;
  };
}