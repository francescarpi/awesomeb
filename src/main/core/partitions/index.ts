import { TPartitionId } from '~/types';
import { Partition } from './partition';
import { config } from '@/core';
export { Partition } from './partition';

export const defaultPartition = new Partition('Default', '#ffffff', false);
export const privatePartition = new Partition('Private', '#000000', true);
export const internalPartition = new Partition('Internal', '#00000000', false);

export function getPartitions(): Map<TPartitionId, Partition> {
  const partitions = new Map<TPartitionId, Partition>();

  partitions.set(defaultPartition.id, defaultPartition);
  partitions.set(privatePartition.id, privatePartition);

  for (const partitionConfig of config.getProperty('partitions')) {
    const partition = new Partition(partitionConfig.name, partitionConfig.color, false);
    partitions.set(partition.id, partition);
  }

  return partitions;
}
