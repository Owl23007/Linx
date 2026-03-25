import type { Result } from '@/models/common';
import type { CreateRoomDto, JoinRoomDto } from '@/types/room';
import { get, post } from '@/utils/http';

export function createRoom(data: CreateRoomDto): Promise<Result> {
  return post('/linx/rooms', data);
}

export function joinRoom(data: JoinRoomDto): Promise<Result> {
  return post('/linx/rooms/join', data);
}

export function getMyRooms(): Promise<Result> {
  return get('/linx/rooms/mine');
}

export function getRoomDetails(roomId: number): Promise<Result> {
  return get(`/linx/rooms/${roomId}`);
}

