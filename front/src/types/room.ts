export type RoomStatus = 'ACTIVE' | 'CLOSED';

export type RoomMemberRole = 'OWNER' | 'MEMBER';

export interface CreateRoomDto {
  name: string;
  gameName?: string;
  maxMembers?: number;
  networkName: string;
  networkSecret: string;
  relayAddresses: string[];
  virtualIp?: string;
  connectionMode?: string;
}

export interface JoinRoomDto {
  roomCode: string;
  virtualIp?: string;
  connectionMode?: string;
}

export interface RoomMemberVO {
  membershipId: number;
  userId: number;
  displayName: string;
  role: RoomMemberRole;
  virtualIp?: string;
  connectionMode?: string;
  joinedAt: string;
  lastActiveAt?: string;
}

export interface RoomVO {
  id: number;
  name: string;
  roomCode: string;
  gameName?: string;
  networkName?: string;
  networkSecret?: string;
  relayAddresses?: string[];
  status: RoomStatus;
  ownerId: number;
  ownerName: string;
  maxMembers: number;
  memberCount: number;
  myRole: RoomMemberRole;
  myVirtualIp?: string;
  myConnectionMode?: string;
  createdAt: string;
  updatedAt?: string;
  members?: RoomMemberVO[];
}
