import type { URL } from "url";
import type { RequestInit, Response } from "node-fetch";

import Bucket from "./bucket";

type BucketClassifier = {
	route: string;
	identifier: string;
};

class Client {
	#buckets: Map<
		BucketClassifier["route"],
		Map<BucketClassifier["identifier"], Bucket>
	>;

	globalResetAfter: number;

	constructor() {
		this.#buckets = new Map();
		this.globalResetAfter = 0;
	}

	async checkGlobalRateLimit() {
		return new Promise((resolve) => {
			if (this.globalResetAfter === 0) {
				resolve(true);
			}

			setTimeout(() => {
				this.globalResetAfter = 0;
				resolve(true);
			}, this.globalResetAfter);
		});
	}

	setGlobalReset(timestamp: number) {
		this.globalResetAfter = timestamp;
	}

	async #queue(url: URL, options: RequestInit, bucket: BucketClassifier) {
		if (bucket?.route == null || bucket?.identifier == null) {
			throw new Error("You must define a bucket route and identifier");
		}

		let routeMap = this.#buckets.get(bucket?.route);

		if (routeMap == null) {
			routeMap = new Map([
				[
					bucket.identifier,
					new Bucket(this.checkGlobalRateLimit, this.setGlobalReset),
				],
			]);
			this.#buckets.set(bucket.route, routeMap);
		}

		let targetBucket = routeMap.get(bucket.identifier);

		if (targetBucket == null) {
			targetBucket = new Bucket(this.checkGlobalRateLimit, this.setGlobalReset);
			routeMap?.set(bucket.identifier, targetBucket);
		}

		return targetBucket.request(url, options);
	}

	async get(
		url: URL,
		options: RequestInit,
		bucket: BucketClassifier
	): Promise<Response> {
		return this.#queue(url, { method: "GET", ...options }, bucket);
	}

	async post(
		url: URL,
		options: RequestInit,
		bucket: BucketClassifier
	): Promise<Response> {
		return this.#queue(url, { method: "POST", ...options }, bucket);
	}

	async patch(
		url: URL,
		options: RequestInit,
		bucket: BucketClassifier
	): Promise<Response> {
		return this.#queue(url, { method: "PATCH", ...options }, bucket);
	}

	async put(
		url: URL,
		options: RequestInit,
		bucket: BucketClassifier
	): Promise<Response> {
		return this.#queue(url, { method: "PUT", ...options }, bucket);
	}

	async delete(
		url: URL,
		options: RequestInit,
		bucket: BucketClassifier
	): Promise<Response> {
		return this.#queue(url, { method: "DELETE", ...options }, bucket);
	}
}

export default (() => new Client())();
