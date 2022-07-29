export interface BusinessCapability {
  id: string
  type: 'BusinessCapability'
  displayName: string
  level: number
  parentId: string | null
  children: string[]
  relatedApplicationIds: Set<string>
  aggregatedApplicationCount: number
}
