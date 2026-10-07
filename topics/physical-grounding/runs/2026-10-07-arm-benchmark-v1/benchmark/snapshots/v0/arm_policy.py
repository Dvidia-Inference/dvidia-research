"""An explicitly authored, contact-gated placement procedure; not learned video."""
from __future__ import annotations
import numpy as np

PROCEDURE = ('approach','descend','close','lift','transfer','place','release','retreat','verify')


class ArmPickPlacePolicy:
    def __init__(self, environment):
        self.env=environment
        self.stage='approach'
        self._stage_ticks=0
        self._stable_ticks=0
        self._grasp_position=None
        self._lift_position=None
        self._last_goal=None

    def _next(self, stage):
        self.stage=stage;self._stage_ticks=0;self._stable_ticks=0

    def __call__(self, observation):
        c=self.env.config
        object_position=np.asarray(observation['object_position'])
        target=np.asarray(observation['target_position'])
        tcp=np.asarray(observation['end_effector_position'])
        offset=.026-c.object_half_size[2]
        width=.08
        if self.stage=='approach':
            goal=object_position+np.array([0.,0.,.15])
            if np.linalg.norm(tcp-goal)<.012:
                self._grasp_position=object_position+np.array([0.,0.,offset]);self._next('descend')
        if self.stage=='descend':
            goal=self._grasp_position
            if np.linalg.norm(tcp-goal)<.0045 and np.linalg.norm(observation['end_effector_velocity'])<.05:
                self._stable_ticks+=1
            else:self._stable_ticks=0
            if self._stable_ticks>=5:self._next('close')
        if self.stage=='close':
            goal=self._grasp_position;width=.028
            both=observation['grasp_contacts']['left']>0 and observation['grasp_contacts']['right']>0
            self._stable_ticks=self._stable_ticks+1 if both else 0
            if self._stable_ticks>=10:
                self._lift_position=goal+np.array([0.,0.,.13]);self._next('lift')
        if self.stage=='lift':
            goal=self._lift_position;width=.028
            if object_position[2]>self.env.initial_object_position[2]+.06 and np.linalg.norm(tcp-goal)<.015:
                self._next('transfer')
        if self.stage=='transfer':
            goal=target+np.array([0.,0.,offset+.13]);width=.028
            if np.linalg.norm(tcp-goal)<.012:self._next('place')
        if self.stage=='place':
            goal=target+np.array([0.,0.,offset]);width=.028
            if observation['table_contacts']>0 and np.linalg.norm(object_position[:2]-target[:2])<.018 and np.linalg.norm(tcp-goal)<.008:
                self._next('release')
        if self.stage=='release':
            goal=target+np.array([0.,0.,offset]);width=.08
            if observation['gripper_width']>.065 and self._stage_ticks>=10:self._next('retreat')
        if self.stage in ('retreat','verify'):
            goal=target+np.array([0.,0.,offset+.13]);width=.08
            if self.stage=='retreat' and np.linalg.norm(tcp-goal)<.02:self._next('verify')
        self._last_goal=goal.copy();self._stage_ticks+=1
        return {'joint_targets':self.env.joint_targets_for_pose(goal),'gripper_width':width}
