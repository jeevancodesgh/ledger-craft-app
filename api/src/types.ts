export type AppEnv = {
  Variables: {
    requestId: string;
    checkDatabase?: () => Promise<boolean>;
  };
};

export type AppDependencies = {
  checkDatabase?: () => Promise<boolean>;
};
