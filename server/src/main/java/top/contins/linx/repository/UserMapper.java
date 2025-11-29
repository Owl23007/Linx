package top.contins.linx.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import top.contins.linx.model.entity.User;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
