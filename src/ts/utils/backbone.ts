/** Call parent class method in Backbone extend pattern */
export const callSuper = (instance: any, method: string, args: IArguments | any[] = []): any => {
  const proto = (instance as any).constructor.__super__
  return proto[method].apply(instance, args)
}
