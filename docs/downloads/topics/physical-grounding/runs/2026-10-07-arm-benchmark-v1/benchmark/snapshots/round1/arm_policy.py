"""An explicitly authored, contact-gated placement procedure; not learned video."""
from __future__ import annotations
import numpy as np

PROCEDURE = ('approach','descend','close','lift','transfer','place','release','retreat','verify')
POLICY_REVISION = 'dimension-aware-contact-round1'


class ArmPickPlacePolicy:
    def __init__(self, environment):
        self.env=environment
        self.stage='approach'
        self._stage_ticks=0
        self._stable_ticks=0
        self._grasp_position=None
        self._lift_position=None
        self._last_goal=None
        self.failure_reason=None
        self._grip_gap=None
        self._grip_normal_target=0.
        self._measured_pad_forces={'left':0.,'right':0.}

    def _next(self, stage):
        self.stage=stage;self._stage_ticks=0;self._stable_ticks=0

    def diagnostics(self):
        """Control provenance and measured forces, without a learned-policy claim."""
        return {'revision':POLICY_REVISION,'phase':self.stage,'phase_elapsed_seconds':self._stage_ticks*self.env.config.control_dt,
                'failure_reason':self.failure_reason,'grip_normal_target_n':self._grip_normal_target,
                'pad_normal_forces_n':dict(self._measured_pad_forces),'commanded_grip_gap_m':self._grip_gap,
                'recovery_count':0,'observations':'privileged simulator state','policy_origin':'authored controller'}

    def _grip_command(self, observation):
        c=self.env.config
        width=float(observation['object_size'][0])
        mu=float(observation['effective_sliding_friction']['jaw_object'])
        # Per-pad demand gives a nominal 3x static Coulomb load margin. The
        # native actuator cap is unchanged and may make a task infeasible.
        self._grip_normal_target=min(max(.8,1.5*c.object_mass*c.gravity/mu),.9*c.jaw_force_limit)
        nominal=width-2*self._grip_normal_target/250.
        if self._grip_gap is None:
            self._grip_gap=float(np.clip(nominal,0.,.08))
        forces=observation['pad_normal_forces']
        self._measured_pad_forces={side:float(forces[side]) for side in ('left','right')}
        # Correct only once the pads approach the object; zero force while the
        # jaws are still travelling is not evidence to squeeze harder.
        if observation['gripper_width']<=width+.002:
            error=self._grip_normal_target-min(self._measured_pad_forces.values())
            correction=float(np.clip(.001*error,-.0002,.0002))
            self._grip_gap=float(np.clip(self._grip_gap-correction,max(0.,nominal-.008),min(.08,nominal+.008)))
        return self._grip_gap

    def __call__(self, observation):
        c=self.env.config
        object_position=np.asarray(observation['object_position'])
        target=np.asarray(observation['target_position'])
        tcp=np.asarray(observation['end_effector_position'])
        offset=.026-c.object_half_size[2]
        width=.08
        grip_width=self._grip_command(observation) if self.stage in ('close','lift','transfer','place') else None
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
            goal=self._grasp_position;width=self._grip_command(observation) if grip_width is None else grip_width
            both=observation['grasp_contacts']['left']>0 and observation['grasp_contacts']['right']>0
            force_ready=min(self._measured_pad_forces.values())>=.75*self._grip_normal_target
            self._stable_ticks=self._stable_ticks+1 if both and force_ready else 0
            if self._stable_ticks>=10:
                self._lift_position=goal+np.array([0.,0.,.13]);self._next('lift')
        if self.stage=='lift':
            goal=self._lift_position;width=self._grip_gap
            if object_position[2]>self.env.initial_object_position[2]+.06 and np.linalg.norm(tcp-goal)<.015:
                self._next('transfer')
        if self.stage=='transfer':
            goal=target+np.array([0.,0.,offset+.13]);width=self._grip_gap
            if np.linalg.norm(tcp-goal)<.012:self._next('place')
        if self.stage=='place':
            goal=target+np.array([0.,0.,offset]);width=self._grip_gap
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
