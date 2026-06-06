declare module "google-trends-api" {
  type InterestOverTimeOptions = {
    keyword: string;
    startTime: Date;
    endTime: Date;
    geo?: string;
  };

  const googleTrends: {
    interestOverTime: (options: InterestOverTimeOptions) => Promise<string>;
  };

  export default googleTrends;
}
