/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  endpoint: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalRequests: number;
}

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Record response time for an endpoint
   */
  record(endpoint: string, responseTime: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)!.push(responseTime);

    // Keep only last 1000 requests per endpoint
    const times = this.metrics.get(endpoint)!;
    if (times.length > 1000) {
      times.shift();
    }
  }

  /**
   * Get metrics for an endpoint
   */
  getMetrics(endpoint: string): PerformanceMetrics | null {
    const times = this.metrics.get(endpoint);
    if (!times || times.length === 0) return null;

    return {
      endpoint,
      avgResponseTime: Math.round(
        times.reduce((a, b) => a + b, 0) / times.length
      ),
      minResponseTime: Math.min(...times),
      maxResponseTime: Math.max(...times),
      totalRequests: times.length,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    const results: PerformanceMetrics[] = [];

    for (const [endpoint] of this.metrics) {
      const metrics = this.getMetrics(endpoint);
      if (metrics) {
        results.push(metrics);
      }
    }

    // Sort by total requests (most popular endpoints first)
    return results.sort((a, b) => b.totalRequests - a.totalRequests);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();
