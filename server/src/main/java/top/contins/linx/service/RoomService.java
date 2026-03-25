package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.dto.CreateRoomDto;
import top.contins.linx.model.dto.JoinRoomDto;
import top.contins.linx.model.entity.Room;
import top.contins.linx.model.entity.RoomMember;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.enums.RoomMemberRole;
import top.contins.linx.model.enums.RoomStatus;
import top.contins.linx.model.vo.RoomMemberVO;
import top.contins.linx.model.vo.RoomVO;
import top.contins.linx.repository.RoomMapper;
import top.contins.linx.repository.RoomMemberMapper;
import top.contins.linx.repository.UserMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomService {

    private static final String ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final String RELAY_SEPARATOR = ";";

    private final RoomMapper roomMapper;
    private final RoomMemberMapper roomMemberMapper;
    private final UserMapper userMapper;
    private final Random random = new Random();

    @Autowired
    public RoomService(RoomMapper roomMapper, RoomMemberMapper roomMemberMapper, UserMapper userMapper) {
        this.roomMapper = roomMapper;
        this.roomMemberMapper = roomMemberMapper;
        this.userMapper = userMapper;
    }

    public RoomVO createRoom(Long creatorId, CreateRoomDto dto) {
        String roomName = sanitizeText(dto.getName());
        if (roomName == null || roomName.isBlank()) {
            throw new RuntimeException("????????");
        }

        String networkName = sanitizeText(dto.getNetworkName());
        if (networkName == null || networkName.isBlank()) {
            throw new RuntimeException("?????????");
        }

        String networkSecret = sanitizeText(dto.getNetworkSecret());
        if (networkSecret == null || networkSecret.isBlank()) {
            throw new RuntimeException("????????");
        }

        List<String> relayAddresses = normalizeRelayAddresses(dto.getRelayAddresses());
        if (relayAddresses.isEmpty()) {
            throw new RuntimeException("??????????");
        }

        String roomCode = generateUniqueRoomCode();
        Room room = Room.builder()
                .name(roomName)
                .roomCode(roomCode)
                .gameName(sanitizeText(dto.getGameName()))
                .networkName(networkName)
                .networkSecret(networkSecret)
                .relayAddresses(serializeRelayAddresses(relayAddresses))
                .ownerId(creatorId)
                .status(RoomStatus.ACTIVE)
                .maxMembers(normalizeMaxMembers(dto.getMaxMembers()))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        roomMapper.insert(room);

        RoomMember ownerMember = RoomMember.builder()
                .roomId(room.getId())
                .userId(creatorId)
                .role(RoomMemberRole.OWNER)
                .virtualIp(sanitizeText(dto.getVirtualIp()))
                .connectionMode(normalizeConnectionMode(dto.getConnectionMode()))
                .joinedAt(LocalDateTime.now())
                .lastActiveAt(LocalDateTime.now())
                .build();
        roomMemberMapper.insert(ownerMember);

        return getRoomDetails(room.getId(), creatorId);
    }

    public RoomVO joinRoom(Long userId, JoinRoomDto dto) {
        String normalizedCode = normalizeRoomCode(dto.getRoomCode());
        if (normalizedCode == null || normalizedCode.isBlank()) {
            throw new RuntimeException("???????");
        }

        Room room = roomMapper.findByRoomCode(normalizedCode);
        if (room == null) {
            throw new RuntimeException("?????");
        }

        if (room.getStatus() != RoomStatus.ACTIVE) {
            throw new RuntimeException("??????");
        }

        RoomMember existingMember = roomMemberMapper.findByRoomIdAndUserId(room.getId(), userId);
        if (existingMember != null) {
            existingMember.setVirtualIp(sanitizeText(dto.getVirtualIp()));
            existingMember.setConnectionMode(normalizeConnectionMode(dto.getConnectionMode()));
            existingMember.setLastActiveAt(LocalDateTime.now());
            roomMemberMapper.updateById(existingMember);

            return getRoomDetails(room.getId(), userId);
        }

        long memberCount = roomMemberMapper.countByRoomId(room.getId());
        if (memberCount >= room.getMaxMembers()) {
            throw new RuntimeException("??????");
        }

        RoomMember roomMember = RoomMember.builder()
                .roomId(room.getId())
                .userId(userId)
                .role(RoomMemberRole.MEMBER)
                .virtualIp(sanitizeText(dto.getVirtualIp()))
                .connectionMode(normalizeConnectionMode(dto.getConnectionMode()))
                .joinedAt(LocalDateTime.now())
                .lastActiveAt(LocalDateTime.now())
                .build();
        roomMemberMapper.insert(roomMember);

        room.setUpdatedAt(LocalDateTime.now());
        roomMapper.updateById(room);

        return getRoomDetails(room.getId(), userId);
    }

    public List<RoomVO> getMyRooms(Long userId) {
        List<Room> rooms = roomMapper.findByUserIdAndStatus(userId, RoomStatus.ACTIVE);
        return rooms.stream()
                .map(room -> buildRoomVO(room, userId, false))
                .collect(Collectors.toList());
    }

    public RoomVO getRoomDetails(Long roomId, Long requesterId) {
        Room room = roomMapper.selectById(roomId);
        if (room == null) {
            throw new RuntimeException("?????");
        }

        if (!roomMemberMapper.existsByRoomIdAndUserId(roomId, requesterId)) {
            throw new RuntimeException("???????,????????");
        }

        return buildRoomVO(room, requesterId, true);
    }

    private RoomVO buildRoomVO(Room room, Long requesterId, boolean includeMembers) {
        RoomMember myMember = roomMemberMapper.findByRoomIdAndUserId(room.getId(), requesterId);
        if (myMember == null) {
            throw new RuntimeException("???????");
        }

        User owner = userMapper.selectById(room.getOwnerId());
        long memberCount = roomMapper.countMembersByRoomId(room.getId());

        RoomVO roomVO = RoomVO.builder()
                .id(room.getId())
                .name(room.getName())
                .roomCode(room.getRoomCode())
                .gameName(room.getGameName())
                .networkName(room.getNetworkName())
                .networkSecret(room.getNetworkSecret())
                .relayAddresses(deserializeRelayAddresses(room.getRelayAddresses()))
                .status(room.getStatus())
                .ownerId(room.getOwnerId())
                .ownerName(owner != null ? "??" + owner.getId() : "????")
                .maxMembers(room.getMaxMembers())
                .memberCount((int) memberCount)
                .myRole(myMember.getRole())
                .myVirtualIp(myMember.getVirtualIp())
                .myConnectionMode(myMember.getConnectionMode())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();

        if (includeMembers) {
            List<RoomMemberVO> memberVOList = roomMemberMapper.findByRoomIdOrderByJoinedAtAsc(room.getId())
                    .stream()
                    .map(this::buildRoomMemberVO)
                    .collect(Collectors.toList());
            roomVO.setMembers(memberVOList);
        }

        return roomVO;
    }

    private RoomMemberVO buildRoomMemberVO(RoomMember member) {
        User user = userMapper.selectById(member.getUserId());
        return RoomMemberVO.builder()
                .membershipId(member.getId())
                .userId(member.getUserId())
                .displayName(user != null ? "??" + user.getId() : "????")
                .role(member.getRole())
                .virtualIp(member.getVirtualIp())
                .connectionMode(member.getConnectionMode())
                .joinedAt(member.getJoinedAt())
                .lastActiveAt(member.getLastActiveAt())
                .build();
    }

    private Integer normalizeMaxMembers(Integer maxMembers) {
        if (maxMembers == null) {
            return 8;
        }
        if (maxMembers < 2) {
            return 2;
        }
        if (maxMembers > 64) {
            return 64;
        }
        return maxMembers;
    }

    private String normalizeConnectionMode(String mode) {
        String normalized = sanitizeText(mode);
        if (normalized == null || normalized.isBlank()) {
            return "UNKNOWN";
        }
        return normalized.toUpperCase();
    }

    private String sanitizeText(String text) {
        if (text == null) {
            return null;
        }
        String trimmed = text.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRoomCode(String roomCode) {
        String normalized = sanitizeText(roomCode);
        if (normalized == null) {
            return null;
        }
        return normalized.toUpperCase().replace(" ", "");
    }

    private List<String> normalizeRelayAddresses(List<String> relayAddresses) {
        if (relayAddresses == null || relayAddresses.isEmpty()) {
            return new ArrayList<>();
        }

        return relayAddresses.stream()
                .map(this::sanitizeText)
                .filter(item -> item != null && !item.isBlank())
                .map(this::normalizeRelayAddress)
                .distinct()
                .collect(Collectors.toList());
    }

    private String normalizeRelayAddress(String address) {
        if (address.contains("://")) {
            return address;
        }
        return "tcp://" + address;
    }

    private String serializeRelayAddresses(List<String> relayAddresses) {
        return String.join(RELAY_SEPARATOR, relayAddresses);
    }

    private List<String> deserializeRelayAddresses(String relayAddressesRaw) {
        if (relayAddressesRaw == null || relayAddressesRaw.isBlank()) {
            return new ArrayList<>();
        }

        return Arrays.stream(relayAddressesRaw.split(RELAY_SEPARATOR))
                .map(this::sanitizeText)
                .filter(item -> item != null && !item.isBlank())
                .collect(Collectors.toList());
    }

    private String generateUniqueRoomCode() {
        for (int i = 0; i < 20; i++) {
            String candidate = generateRoomCode();
            if (roomMapper.findByRoomCode(candidate) == null) {
                return candidate;
            }
        }
        throw new RuntimeException("???????,???");
    }

    private String generateRoomCode() {
        StringBuilder first = new StringBuilder(4);
        StringBuilder second = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            first.append(ROOM_CODE_CHARS.charAt(random.nextInt(ROOM_CODE_CHARS.length())));
            second.append(ROOM_CODE_CHARS.charAt(random.nextInt(ROOM_CODE_CHARS.length())));
        }
        return first + "-" + second;
    }
}
