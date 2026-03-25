# Session TODO - Room Integration (2026-03-25)

## Goal
- Implement end-to-end room integration in this session:
- Create room
- Join room by room code
- Load my room list
- Load room details with member list
- Connect lobby UI actions to real room APIs

## Checklist
- [x] Add backend room schema (`rooms`, `room_members`) in `server/src/main/resources/db/init.sql`
- [x] Add backend room domain (`entity`, `dto`, `vo`, `mapper`, `service`, `controller`)
- [x] Register `/rooms/**` auth interception in `WebConfig`
- [x] Add frontend room API module in `front/src/request/rooms.ts`
- [x] Add frontend room types in `front/src/types/room.ts`
- [x] Add frontend room store in `front/src/stores/room.ts`
- [x] Wire room API into `linxApiService` and store exports
- [x] Replace lobby create/join placeholder with real dialogs + submit flows
- [x] Replace mock recent rooms with backend room list
- [x] Show selected room member list in lobby and support copy room code / my virtual IP
- [x] Run frontend type-check
- [x] Run backend compile check
