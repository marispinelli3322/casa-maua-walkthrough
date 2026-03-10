#!/usr/bin/env python3
"""
Casa Mauá — OBJ/MTL generator (detailed architectural model).

Official dimensions from architectural plans (Sheet 02):
  - Foundation slab:  Z = -0.30 m
  - Ground floor:     Z =  0.00 m
  - Mezzanine floor:  Z =  2.67 m
  - Barrilete (eave): Z =  5.20 m
  - Ridge:            Z =  7.00 m

Coordinate convention used in this file (Z-up, same as original):
  X  →  East (width of house)
  Y  →  North (depth / length of house)
  Z  →  Up

The Three.js loader applies a -90° rotation on X so Y-up = visual up.

Units: 1 OBJ unit = 1 metre.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

# ---------------------------------------------------------------------------
# Output paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
OBJ_PATH = ROOT / "public" / "models" / "casa_maua.obj"
MTL_PATH = ROOT / "public" / "models" / "casa_maua.mtl"
MTL_NAME = MTL_PATH.name   # just the filename, referenced inside the .obj

# ---------------------------------------------------------------------------
# Key vertical levels (Z)
# ---------------------------------------------------------------------------
Z_FOUNDATION = -0.30
Z_FLOOR      =  0.00   # ground floor finished level
Z_MEZZ       =  2.67   # mezzanine floor
Z_BARRILETE  =  5.20   # eave / barrilete
Z_RIDGE      =  7.00   # roof ridge

WALL_T       = 0.20    # wall thickness (bloco 14x19x29)
PILLAR_W     = 0.30    # concrete pillar cross-section

# ---------------------------------------------------------------------------
# Plan footprints  (all X/Y in metres from the SW corner of main body)
# ---------------------------------------------------------------------------
# Main A-frame body
MAIN_X0  =  0.00
MAIN_X1  =  7.45
MAIN_Y0  =  0.00    # front (south) facade  → glass gable
MAIN_Y1  =  8.60    # rear  (north) facade
RIDGE_X  = (MAIN_X0 + MAIN_X1) / 2.0   # 3.725

# Annex (to the right / east of the main body)
ANNEX_X0 =  7.45
ANNEX_X1 = 12.80      # total width 12.80 m
ANNEX_Y0 =  2.20      # south edge (set back from main front facade)
ANNEX_Y1 =  6.30      # north edge
ANNEX_WALL_H = 2.67   # annex wall height (same as mezzanine level = terrace floor)

# Brick tower / nucleo (stair + chimney core, left of centre)
TOWER_X0 = 2.80
TOWER_X1 = 4.10
TOWER_Y0 = 1.50
TOWER_Y1 = 5.80

# Front deck area (south of main body)
DECK_Y0 = -3.50
DECK_Y1 =  0.00

# Pool (thermal pool) in front
POOL_X0 =  1.20
POOL_X1 =  4.60
POOL_Y0 = -5.50
POOL_Y1 = -2.50
POOL_DEPTH = 1.20

# ---------------------------------------------------------------------------
# Vec3 and ObjBuilder
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Vec3:
    x: float
    y: float
    z: float


class ObjBuilder:
    """Incremental OBJ builder — all geometry is Z-up."""

    def __init__(self) -> None:
        self.vertices: list[Vec3] = []
        self._face_lines: list[str] = []   # interleaved with o/usemtl directives
        self._last_mat: str | None = None
        self._last_obj: str | None = None

    # --- primitives --------------------------------------------------------

    def _v(self, v: Vec3) -> int:
        """Register vertex, return 1-based index."""
        self.vertices.append(v)
        return len(self.vertices)

    def _set_obj(self, name: str) -> None:
        if self._last_obj != name:
            self._face_lines.append(f"o {name}")
            self._last_obj = name

    def _set_mat(self, name: str) -> None:
        if self._last_mat != name:
            self._face_lines.append(f"usemtl {name}")
            self._last_mat = name

    def face(
        self,
        name: str,
        mat: str,
        verts: Sequence[Vec3],
        two_sided: bool = False,
    ) -> None:
        self._set_obj(name)
        self._set_mat(mat)
        ids = [self._v(v) for v in verts]
        self._face_lines.append("f " + " ".join(str(i) for i in ids))
        if two_sided:
            self._face_lines.append("f " + " ".join(str(i) for i in reversed(ids)))

    # --- compound shapes ---------------------------------------------------

    def box(
        self,
        name: str,
        mat: str,
        x0: float, x1: float,
        y0: float, y1: float,
        z0: float, z1: float,
        two_sided: bool = True,
    ) -> None:
        """Axis-aligned solid box with six quad faces."""
        A = Vec3(x0, y0, z0); B = Vec3(x1, y0, z0)
        C = Vec3(x1, y1, z0); D = Vec3(x0, y1, z0)
        E = Vec3(x0, y0, z1); F = Vec3(x1, y0, z1)
        G = Vec3(x1, y1, z1); H = Vec3(x0, y1, z1)

        self.face(name, mat, [D, C, B, A], two_sided)   # bottom  (-Z)
        self.face(name, mat, [E, F, G, H], two_sided)   # top     (+Z)
        self.face(name, mat, [A, B, F, E], two_sided)   # front   (-Y)
        self.face(name, mat, [B, C, G, F], two_sided)   # right   (+X)
        self.face(name, mat, [C, D, H, G], two_sided)   # back    (+Y)
        self.face(name, mat, [D, A, E, H], two_sided)   # left    (-X)

    def prism(
        self,
        name: str,
        mat: str,
        front: Sequence[Vec3],
        back: Sequence[Vec3],
        two_sided: bool = True,
    ) -> None:
        """General prism: two matching polygons + side quads."""
        n = len(front)
        assert len(back) == n
        self.face(name, mat, front, two_sided)
        self.face(name, mat, list(reversed(back)), two_sided)
        for i in range(n):
            j = (i + 1) % n
            self.face(name, mat, [front[i], back[i], back[j], front[j]], two_sided)

    def plane(self, name: str, mat: str, verts: Sequence[Vec3]) -> None:
        self.face(name, mat, verts, two_sided=True)

    # --- write -------------------------------------------------------------

    def write(self, path: Path) -> None:
        lines: list[str] = [
            "# Casa Maua — detailed architectural model",
            "# 1 unit = 1 metre  |  Z-up  |  generated by generate_model.py",
            f"mtllib {MTL_NAME}",
            "",
        ]
        for v in self.vertices:
            lines.append(f"v {v.x:.4f} {v.y:.4f} {v.z:.4f}")
        lines.append("")
        lines.extend(self._face_lines)
        lines.append("")
        path.write_text("\n".join(lines), encoding="utf-8")


# ===========================================================================
# Geometry helpers
# ===========================================================================

def beam_along_y(
    b: ObjBuilder,
    name: str,
    mat: str,
    x_centre: float,
    half_w: float,
    y0: float,
    y1: float,
    z0: float,
    z1: float,
) -> None:
    """A rectangular beam running along Y with given cross-section."""
    b.box(name, mat,
          x_centre - half_w, x_centre + half_w,
          y0, y1,
          z0, z1)


def diagonal_beam(
    b: ObjBuilder,
    name: str,
    mat: str,
    x0: float, z0: float,
    x1: float, z1: float,
    y0: float, y1: float,
    half_t: float = 0.06,
) -> None:
    """A diagonal beam in the XZ plane, running along Y.

    The beam has rectangular cross-section (2*half_t wide, perpendicular to
    the diagonal) approximated by a slanted box in X/Z.
    We use a quad prism along Y.
    """
    dx = x1 - x0
    dz = z1 - z0
    length = math.hypot(dx, dz)
    nx = -dz / length   # normal to the beam axis (inward)
    nz =  dx / length

    # Four corners of the cross-section at y0, y1
    pts_front = [
        Vec3(x0 + nx * half_t, y0, z0 + nz * half_t),
        Vec3(x0 - nx * half_t, y0, z0 - nz * half_t),
        Vec3(x1 - nx * half_t, y0, z1 - nz * half_t),
        Vec3(x1 + nx * half_t, y0, z1 + nz * half_t),
    ]
    pts_back = [
        Vec3(x0 + nx * half_t, y1, z0 + nz * half_t),
        Vec3(x0 - nx * half_t, y1, z0 - nz * half_t),
        Vec3(x1 - nx * half_t, y1, z1 - nz * half_t),
        Vec3(x1 + nx * half_t, y1, z1 + nz * half_t),
    ]
    b.prism(name, mat, pts_front, pts_back)


# ===========================================================================
# Scene sections
# ===========================================================================

def build_terrain(b: ObjBuilder) -> None:
    """Large ground plane and earthwork platform."""
    b.plane("terrain", "terrain_grass", [
        Vec3(-20.0, -15.0, Z_FOUNDATION - 0.05),
        Vec3( 25.0, -15.0, Z_FOUNDATION - 0.05),
        Vec3( 25.0,  22.0, Z_FOUNDATION - 0.05),
        Vec3(-20.0,  22.0, Z_FOUNDATION - 0.05),
    ])
    # Raised platform under building
    b.box("plataforma", "concrete",
          -2.0, 14.0,
          -4.5, 12.5,
          Z_FOUNDATION, Z_FLOOR)


def build_foundation(b: ObjBuilder) -> None:
    """Foundation slab for main body and annex."""
    b.box("laje_fundacao_principal", "concrete",
          MAIN_X0, MAIN_X1, MAIN_Y0, MAIN_Y1,
          Z_FOUNDATION, Z_FLOOR)
    b.box("laje_fundacao_anexo", "concrete",
          ANNEX_X0, ANNEX_X1, ANNEX_Y0, ANNEX_Y1,
          Z_FOUNDATION, Z_FLOOR)


def build_ground_floor_slab(b: ObjBuilder) -> None:
    b.box("piso_terreo_principal", "wood_dark_floor",
          MAIN_X0, MAIN_X1, MAIN_Y0, MAIN_Y1,
          Z_FLOOR, Z_FLOOR + 0.05)
    b.box("piso_terreo_anexo", "wood_dark_floor",
          ANNEX_X0, ANNEX_X1, ANNEX_Y0, ANNEX_Y1,
          Z_FLOOR, Z_FLOOR + 0.05)


# ---------------------------------------------------------------------------
# A-frame roof shell
# ---------------------------------------------------------------------------

def build_aframe_roof(b: ObjBuilder) -> None:
    """Corrugated metal roof panels and interior wood lining (forro)."""
    t_out = 0.08   # roof thickness
    t_in  = 0.05   # forro thickness

    # --- Outer roof surfaces ---
    # Left panel (west slope): from X0,Z_FLOOR to RIDGE_X,Z_RIDGE
    b.plane("cobertura_esquerda_exterior", "roof_metal_dark", [
        Vec3(MAIN_X0,  MAIN_Y0, Z_FLOOR),
        Vec3(RIDGE_X,  MAIN_Y0, Z_RIDGE),
        Vec3(RIDGE_X,  MAIN_Y1, Z_RIDGE),
        Vec3(MAIN_X0,  MAIN_Y1, Z_FLOOR),
    ])
    b.plane("cobertura_direita_exterior", "roof_metal_dark", [
        Vec3(RIDGE_X,  MAIN_Y0, Z_RIDGE),
        Vec3(MAIN_X1,  MAIN_Y0, Z_FLOOR),
        Vec3(MAIN_X1,  MAIN_Y1, Z_FLOOR),
        Vec3(RIDGE_X,  MAIN_Y1, Z_RIDGE),
    ])

    # --- Interior forro (wood lining, slightly inset) ---
    # offset inward along the slope normal
    def inset(x: float, z: float, offset: float) -> tuple[float, float]:
        """Shift (x,z) point inward along the slope perpendicular."""
        dx = RIDGE_X - MAIN_X0
        dz = Z_RIDGE  - Z_FLOOR
        L  = math.hypot(dx, dz)
        # normal pointing right & down (inward from left slope)
        nx, nz = dz / L, -dx / L
        return x + nx * offset, z + nz * offset

    # Left forro (viewed from inside, visible face toward interior)
    lx0, lz0 = inset(MAIN_X0 + 0.15,  Z_FLOOR + 0.30, t_in)
    lxR, lzR = inset(RIDGE_X  - 0.10,  Z_RIDGE - 0.25, t_in)
    b.plane("forro_esquerdo", "wood_light", [
        Vec3(lx0, MAIN_Y0 + 0.10, lz0),
        Vec3(lxR, MAIN_Y0 + 0.10, lzR),
        Vec3(lxR, MAIN_Y1 - 0.10, lzR),
        Vec3(lx0, MAIN_Y1 - 0.10, lz0),
    ])

    # Right forro (mirror)
    rx0, rz0 = MAIN_X1 - (lx0 - MAIN_X0), lz0
    rxR, rzR = MAIN_X1 - (lxR - MAIN_X0), lzR
    b.plane("forro_direito", "wood_light", [
        Vec3(rxR, MAIN_Y0 + 0.10, rzR),
        Vec3(rx0, MAIN_Y0 + 0.10, rz0),
        Vec3(rx0, MAIN_Y1 - 0.10, rz0),
        Vec3(rxR, MAIN_Y1 - 0.10, rzR),
    ])


# ---------------------------------------------------------------------------
# Structural A-frame beams (exposed, dark wood)
# ---------------------------------------------------------------------------

def build_aframe_beams(b: ObjBuilder) -> None:
    """Visible diagonal structural beams at regular intervals along Y."""
    beam_half_t = 0.075   # 15 cm square section
    # Spacing along Y (roughly every 1.2 m inside the 8.60 m depth)
    y_positions = [y for y in [0.30, 1.45, 2.60, 3.72, 4.88, 6.00, 7.15, 8.30]
                   if MAIN_Y0 <= y <= MAIN_Y1]

    for idx, yc in enumerate(y_positions):
        yd = beam_half_t   # beam depth along Y
        # Left slope beam: from (MAIN_X0, Z_FLOOR) to (RIDGE_X, Z_RIDGE)
        diagonal_beam(
            b, f"viga_aframe_esq_{idx+1:02d}", "structure_wood",
            MAIN_X0, Z_FLOOR,
            RIDGE_X, Z_RIDGE,
            yc - yd, yc + yd,
            half_t=beam_half_t,
        )
        # Right slope beam
        diagonal_beam(
            b, f"viga_aframe_dir_{idx+1:02d}", "structure_wood",
            RIDGE_X, Z_RIDGE,
            MAIN_X1, Z_FLOOR,
            yc - yd, yc + yd,
            half_t=beam_half_t,
        )
        # Horizontal tie-beam at Z_BARRILETE level
        b.box(
            f"tirante_aframe_{idx+1:02d}", "structure_wood",
            MAIN_X0 + 0.20, MAIN_X1 - 0.20,
            yc - yd, yc + yd,
            Z_BARRILETE - 0.06, Z_BARRILETE + 0.06,
        )

    # Ridge beam along the full length
    b.box("viga_cumeeira", "structure_wood",
          RIDGE_X - 0.08, RIDGE_X + 0.08,
          MAIN_Y0, MAIN_Y1,
          Z_RIDGE - 0.10, Z_RIDGE + 0.02)


# ---------------------------------------------------------------------------
# Front gable — glass + black metal frame
# ---------------------------------------------------------------------------

def build_front_facade(b: ObjBuilder) -> None:
    """Triangular glass facade at south (Y=MAIN_Y0)."""
    Y = MAIN_Y0
    Yw = WALL_T / 2.0  # wall half-thickness

    # Glass triangle (full area, two-sided)
    b.plane("vidro_fachada_frontal", "glass", [
        Vec3(MAIN_X0, Y, Z_FLOOR),
        Vec3(MAIN_X1, Y, Z_FLOOR),
        Vec3(RIDGE_X,  Y, Z_RIDGE),
    ])

    # Black metal frame: perimeter + internal mullions
    fw = 0.06  # frame member half-width

    # Base horizontal member
    b.box("frame_base_frontal", "frame_black",
          MAIN_X0, MAIN_X1, Y - fw, Y + fw, Z_FLOOR, Z_FLOOR + fw * 2)

    # Left edge  (vertical, but sloped — approximated as thin box along slope)
    diagonal_beam(b, "frame_esq_frontal", "frame_black",
                  MAIN_X0, Z_FLOOR, RIDGE_X, Z_RIDGE,
                  Y - fw, Y + fw, half_t=fw)

    # Right edge
    diagonal_beam(b, "frame_dir_frontal", "frame_black",
                  RIDGE_X, Z_RIDGE, MAIN_X1, Z_FLOOR,
                  Y - fw, Y + fw, half_t=fw)

    # Central vertical mullion at ridge
    b.box("frame_central_frontal", "frame_black",
          RIDGE_X - fw, RIDGE_X + fw,
          Y - fw, Y + fw,
          Z_FLOOR, Z_RIDGE)

    # Horizontal grid members at ~1 m intervals
    for z_grid in [Z_FLOOR + 1.0, Z_FLOOR + 2.0, Z_FLOOR + 3.0, Z_BARRILETE]:
        # compute X span at this Z (linear interpolation of triangle sides)
        t_left  = (z_grid - Z_FLOOR) / (Z_RIDGE - Z_FLOOR)
        x_left  = MAIN_X0 + t_left * (RIDGE_X - MAIN_X0)
        x_right = MAIN_X1 - t_left * (MAIN_X1 - RIDGE_X)
        tag = f"frame_horiz_{int(z_grid * 10):03d}"
        b.box(tag, "frame_black",
              x_left, x_right,
              Y - fw, Y + fw,
              z_grid - fw, z_grid + fw)

    # Diagonal mullion left (structural X brace)
    diagonal_beam(b, "frame_diagonal_1_frontal", "frame_black",
                  MAIN_X0 + 0.90, Z_FLOOR + 1.0,
                  RIDGE_X,        Z_RIDGE,
                  Y - fw, Y + fw, half_t=fw * 0.8)

    # Diagonal mullion right
    diagonal_beam(b, "frame_diagonal_2_frontal", "frame_black",
                  RIDGE_X, Z_RIDGE,
                  MAIN_X1 - 0.90, Z_FLOOR + 1.0,
                  Y - fw, Y + fw, half_t=fw * 0.8)


# ---------------------------------------------------------------------------
# Rear gable — white plastered wall with rectangular windows
# ---------------------------------------------------------------------------

def build_rear_facade(b: ObjBuilder) -> None:
    """North rear wall with windows at two levels."""
    Y = MAIN_Y1
    fw = 0.06

    # Outer white wall (triangle shape, as a plane, two-sided)
    b.plane("parede_traseira_exterior", "wall_white", [
        Vec3(MAIN_X0, Y, Z_FLOOR),
        Vec3(RIDGE_X,  Y, Z_RIDGE),
        Vec3(MAIN_X1, Y, Z_FLOOR),
    ])
    # Interior face
    b.plane("parede_traseira_interior", "wall_white", [
        Vec3(MAIN_X0, Y - WALL_T, Z_FLOOR),
        Vec3(MAIN_X1, Y - WALL_T, Z_FLOOR),
        Vec3(RIDGE_X,  Y - WALL_T, Z_RIDGE),
    ])

    # Ground-floor windows  (two, symmetrical)
    win_w = 1.20
    win_z0 = Z_FLOOR + 0.90
    win_z1 = Z_FLOOR + 2.20
    for wx0, label in [(1.10, "esq"), (5.15, "dir")]:
        b.box(f"janela_traseira_terreo_{label}", "glass",
              wx0, wx0 + win_w, Y - WALL_T, Y + 0.02,
              win_z0, win_z1)
        b.box(f"frame_janela_traseira_terreo_{label}", "frame_black",
              wx0 - fw, wx0 + win_w + fw, Y - WALL_T - fw * 0.5, Y + fw * 0.5,
              win_z0 - fw, win_z1 + fw)

    # Mezzanine-level window (centred above, wider)
    mw_z0 = Z_MEZZ + 0.50
    mw_z1 = Z_MEZZ + 1.60
    mw_x0 = 2.40
    mw_x1 = 5.00
    b.box("janela_traseira_mezanino", "glass",
          mw_x0, mw_x1, Y - WALL_T, Y + 0.02,
          mw_z0, mw_z1)
    b.box("frame_janela_traseira_mezanino", "frame_black",
          mw_x0 - fw, mw_x1 + fw, Y - WALL_T - fw * 0.5, Y + fw * 0.5,
          mw_z0 - fw, mw_z1 + fw)


# ---------------------------------------------------------------------------
# Lateral walls (east and west sides of A-frame body)
# ---------------------------------------------------------------------------

def build_lateral_walls(b: ObjBuilder) -> None:
    """East and west triangular gable walls (opaque where not glass)."""
    # West wall (X = MAIN_X0)
    b.plane("parede_lateral_oeste_ext", "wall_white", [
        Vec3(MAIN_X0, MAIN_Y0, Z_FLOOR),
        Vec3(MAIN_X0, MAIN_Y1, Z_FLOOR),
        Vec3(MAIN_X0, MAIN_Y1, Z_BARRILETE),
        Vec3(MAIN_X0, MAIN_Y0, Z_BARRILETE),
    ])
    b.plane("parede_lateral_oeste_int", "wall_white", [
        Vec3(MAIN_X0 + WALL_T, MAIN_Y0, Z_FLOOR),
        Vec3(MAIN_X0 + WALL_T, MAIN_Y0, Z_BARRILETE),
        Vec3(MAIN_X0 + WALL_T, MAIN_Y1, Z_BARRILETE),
        Vec3(MAIN_X0 + WALL_T, MAIN_Y1, Z_FLOOR),
    ])

    # East wall (between main body and annex) — partial height
    # The A-frame roof meets the annex roof at Z_BARRILETE on the east side
    b.plane("parede_lateral_leste_ext", "wall_white", [
        Vec3(MAIN_X1, MAIN_Y0, Z_FLOOR),
        Vec3(MAIN_X1, MAIN_Y0, Z_BARRILETE),
        Vec3(MAIN_X1, MAIN_Y1, Z_BARRILETE),
        Vec3(MAIN_X1, MAIN_Y1, Z_FLOOR),
    ])
    b.plane("parede_lateral_leste_int", "wall_white", [
        Vec3(MAIN_X1 - WALL_T, MAIN_Y0, Z_FLOOR),
        Vec3(MAIN_X1 - WALL_T, MAIN_Y1, Z_FLOOR),
        Vec3(MAIN_X1 - WALL_T, MAIN_Y1, Z_BARRILETE),
        Vec3(MAIN_X1 - WALL_T, MAIN_Y0, Z_BARRILETE),
    ])


# ---------------------------------------------------------------------------
# Annex volume (rectangular box, flat roof = mezzanine terrace)
# ---------------------------------------------------------------------------

def build_annex(b: ObjBuilder) -> None:
    """Annex: kitchen + lavabo + area de servico. Flat roof = outdoor terrace."""
    w = WALL_T
    # Four exterior walls
    # South wall
    b.box("parede_anexo_sul", "wall_white",
          ANNEX_X0, ANNEX_X1, ANNEX_Y0, ANNEX_Y0 + w,
          Z_FLOOR, ANNEX_WALL_H)
    # North wall
    b.box("parede_anexo_norte", "wall_white",
          ANNEX_X0, ANNEX_X1, ANNEX_Y1 - w, ANNEX_Y1,
          Z_FLOOR, ANNEX_WALL_H)
    # East wall (with glazing at ground level)
    b.box("parede_anexo_leste", "wall_white",
          ANNEX_X1 - w, ANNEX_X1, ANNEX_Y0, ANNEX_Y1,
          Z_FLOOR, ANNEX_WALL_H)
    # West wall — adjoins main body, leave gap for connection opening
    b.box("parede_anexo_oeste_inf", "wall_white",
          ANNEX_X0, ANNEX_X0 + w, ANNEX_Y0, ANNEX_Y1,
          Z_FLOOR, ANNEX_WALL_H)

    # Roof slab (which becomes the terrace floor)
    b.box("laje_cobertura_anexo", "concrete",
          ANNEX_X0, ANNEX_X1, ANNEX_Y0, ANNEX_Y1,
          ANNEX_WALL_H, ANNEX_WALL_H + 0.15)

    # Terrace floor finish (deck wood on annex roof)
    b.box("piso_terraco_mezanino_externo", "deck_wood",
          ANNEX_X0 + 0.05, ANNEX_X1 - 0.05,
          ANNEX_Y0 + 0.05, ANNEX_Y1 - 0.05,
          ANNEX_WALL_H + 0.15, ANNEX_WALL_H + 0.20)

    # South-facing window in annex (kitchen window)
    b.box("janela_cozinha_sul", "glass",
          ANNEX_X0 + 1.00, ANNEX_X0 + 3.20,
          ANNEX_Y0 - 0.02, ANNEX_Y0 + w + 0.02,
          Z_FLOOR + 1.00, Z_FLOOR + 2.20)
    b.box("frame_janela_cozinha", "frame_black",
          ANNEX_X0 + 0.95, ANNEX_X0 + 3.25,
          ANNEX_Y0 - 0.04, ANNEX_Y0 + w + 0.04,
          Z_FLOOR + 0.95, Z_FLOOR + 2.25)

    # East window (area de servico)
    b.box("janela_servico_leste", "glass",
          ANNEX_X1 - w - 0.02, ANNEX_X1 + 0.02,
          ANNEX_Y0 + 0.60, ANNEX_Y0 + 1.60,
          Z_FLOOR + 1.00, Z_FLOOR + 2.00)


# ---------------------------------------------------------------------------
# Brick tower (staircase + chimney core)
# ---------------------------------------------------------------------------

def build_brick_tower(b: ObjBuilder) -> None:
    """Masonry tower rising through the A-frame interior and above."""
    # Tower body up to barrilete + a bit above
    b.box("torre_tijolo_corpo", "brick",
          TOWER_X0, TOWER_X1, TOWER_Y0, TOWER_Y1,
          Z_FLOOR, Z_BARRILETE + 0.80)
    # Chimney stack above barrilete to ridge + extension
    chimney_x0 = TOWER_X0 + 0.30
    chimney_x1 = TOWER_X1 - 0.10
    b.box("chamine", "brick",
          chimney_x0, chimney_x1, TOWER_Y0 + 0.40, TOWER_Y1 - 1.20,
          Z_BARRILETE + 0.80, Z_RIDGE + 0.60)
    # Chimney cap
    b.box("tampao_chamine", "concrete",
          chimney_x0 - 0.05, chimney_x1 + 0.05,
          TOWER_Y0 + 0.35, TOWER_Y1 - 1.15,
          Z_RIDGE + 0.60, Z_RIDGE + 0.68)


# ---------------------------------------------------------------------------
# Interior partitions — ground floor
# ---------------------------------------------------------------------------

def build_interior_walls_ground(b: ObjBuilder) -> None:
    """Internal dividing walls at ground floor level."""
    w = WALL_T
    h = 2.50   # interior wall height (below slab above)

    # Partition between Quarto and Sala 1 (roughly at X = 3.45)
    b.box("parede_quarto_sala1", "wall_white",
          3.45, 3.45 + w, MAIN_Y0 + 0.20, TOWER_Y0,
          Z_FLOOR, Z_FLOOR + h)

    # BWC 01 south wall (closes off bathroom from sala 1)
    b.box("parede_bwc01_sul", "wall_white",
          MAIN_X0 + 0.20, 3.45, 3.35, 3.35 + w,
          Z_FLOOR, Z_FLOOR + h)
    # BWC 01 east wall
    b.box("parede_bwc01_leste", "wall_white",
          TOWER_X0 - w, TOWER_X0, MAIN_Y0 + 0.20, 3.35 + w,
          Z_FLOOR, Z_FLOOR + h)

    # Sala 2 divider (between sala 2 / TV room and sala 1)
    b.box("parede_sala2_norte", "wall_white",
          MAIN_X0 + 0.20, 3.45, 5.90, 5.90 + w,
          Z_FLOOR, Z_FLOOR + h)

    # Kitchen/lavabo divider in annex (N-S partition)
    b.box("parede_cozinha_lavabo", "wall_white",
          ANNEX_X0 + w, ANNEX_X1 - w, 4.50, 4.50 + w,
          Z_FLOOR, Z_FLOOR + h)
    # Lavabo/area servico divider
    b.box("parede_lavabo_servico", "wall_white",
          ANNEX_X0 + w, ANNEX_X0 + 2.90 + w, ANNEX_Y0 + w, ANNEX_Y0 + w + w,
          Z_FLOOR, Z_FLOOR + h)
    # Area servico north end
    b.box("parede_servico_norte", "wall_white",
          ANNEX_X0 + w, ANNEX_X0 + 2.90 + w, 4.50, 4.50 + w,
          Z_FLOOR, Z_FLOOR + h)


# ---------------------------------------------------------------------------
# Mezzanine slab
# ---------------------------------------------------------------------------

def build_mezzanine(b: ObjBuilder) -> None:
    """Mezzanine floor slab (mezanino interno) at Z_MEZZ."""
    # Mezzanine over the quarto / BWC side (roughly left half of main body)
    b.box("laje_mezanino_interno", "wood_dark_floor",
          MAIN_X0 + 0.20, TOWER_X0,
          MAIN_Y0 + 0.20, MAIN_Y1 - 0.20,
          Z_MEZZ, Z_MEZZ + 0.12)

    # Upper-floor partition: BWC 02 south wall
    b.box("parede_bwc02_sul", "wall_white",
          MAIN_X0 + 0.20, 2.90, 3.35, 3.35 + WALL_T,
          Z_MEZZ + 0.12, Z_MEZZ + 0.12 + 2.40)
    # BWC 02 east wall
    b.box("parede_bwc02_leste", "wall_white",
          2.90, 2.90 + WALL_T, MAIN_Y0 + 0.20, 3.35 + WALL_T,
          Z_MEZZ + 0.12, Z_MEZZ + 0.12 + 2.40)

    # Guardrail at mezzanine opening (east edge toward sala 1)
    b.box("guarda_mezanino_leste", "frame_black",
          TOWER_X0 - 0.04, TOWER_X0, MAIN_Y0 + 0.20, MAIN_Y1 - 0.20,
          Z_MEZZ + 0.12, Z_MEZZ + 0.12 + 1.10)


# ---------------------------------------------------------------------------
# Internal staircase
# ---------------------------------------------------------------------------

def build_internal_stair(b: ObjBuilder) -> None:
    """Stair inside the brick tower, from ground to mezzanine level."""
    stair_x0 = TOWER_X1 + 0.05
    stair_x1 = stair_x0 + 0.90
    step_y0  = TOWER_Y0 + 0.20
    n_steps  = 11
    step_rise = Z_MEZZ / n_steps
    step_run  = (TOWER_Y1 - step_y0) / n_steps

    for i in range(n_steps):
        z0 = Z_FLOOR + i * step_rise
        z1 = z0 + step_rise * 0.15
        y0 = step_y0 + i * step_run
        y1 = y0 + step_run
        b.box(f"degrau_interno_{i+1:02d}", "wood_dark_floor",
              stair_x0, stair_x1, y0, y1, z0, z1)

    b.box("corrimao_interno_esq", "frame_black",
          stair_x0 - 0.04, stair_x0, step_y0, step_y0 + n_steps * step_run,
          Z_FLOOR + 0.85, Z_MEZZ + 0.12 + 0.90)


# ---------------------------------------------------------------------------
# External stair to terrace
# ---------------------------------------------------------------------------

def build_external_stair(b: ObjBuilder) -> None:
    """Metal stair from ground up to annex roof terrace."""
    sx0 = ANNEX_X1 + 0.10
    sx1 = sx0 + 0.90
    start_y = ANNEX_Y0 + 0.30
    z_top   = ANNEX_WALL_H + 0.20
    n_steps = 12
    step_rise = z_top / n_steps
    step_run  = 3.50 / n_steps   # stair runs ~3.5 m south to north

    for i in range(n_steps):
        z0 = i * step_rise
        z1 = z0 + step_rise * 0.12
        y0 = start_y + i * step_run
        y1 = y0 + step_run
        b.box(f"degrau_externo_{i+1:02d}", "frame_black",
              sx0, sx1, y0, y1, z0, z1)

    b.box("corrimao_externo", "frame_black",
          sx0, sx0 + 0.04, start_y, start_y + n_steps * step_run,
          Z_FLOOR + 0.85, z_top + 1.10)


# ---------------------------------------------------------------------------
# Terrace guardrails
# ---------------------------------------------------------------------------

def build_terrace_guardrails(b: ObjBuilder) -> None:
    """Metal guardrails around the mezzanine outdoor terrace."""
    h_rail = 1.10
    rail_t = 0.04
    z_base = ANNEX_WALL_H + 0.20

    # South edge
    b.box("guarda_terraco_sul", "frame_black",
          ANNEX_X0, ANNEX_X1, ANNEX_Y0, ANNEX_Y0 + rail_t,
          z_base, z_base + h_rail)
    # North edge
    b.box("guarda_terraco_norte", "frame_black",
          ANNEX_X0, ANNEX_X1, ANNEX_Y1 - rail_t, ANNEX_Y1,
          z_base, z_base + h_rail)
    # East edge
    b.box("guarda_terraco_leste", "frame_black",
          ANNEX_X1 - rail_t, ANNEX_X1, ANNEX_Y0, ANNEX_Y1,
          z_base, z_base + h_rail)
    # West edge (junction with main A-frame wall)
    b.box("guarda_terraco_oeste", "frame_black",
          ANNEX_X0, ANNEX_X0 + rail_t, ANNEX_Y0, ANNEX_Y1,
          z_base, z_base + h_rail)


# ---------------------------------------------------------------------------
# Front deck and pool
# ---------------------------------------------------------------------------

def build_front_deck(b: ObjBuilder) -> None:
    """Wooden deck in front of south facade, steps down to ground."""
    deck_z0 = Z_FLOOR - 0.15   # deck sits slightly below floor level
    deck_z1 = deck_z0 + 0.10

    b.box("deck_frontal_principal", "deck_wood",
          MAIN_X0 - 0.50, MAIN_X1 + 0.50,
          DECK_Y0, DECK_Y1,
          deck_z0, deck_z1)

    # Steps from deck to ground level (3 risers)
    for i, (step_y0, step_y1) in enumerate([
        (DECK_Y0 - 0.45, DECK_Y0),
        (DECK_Y0 - 0.90, DECK_Y0 - 0.45),
        (DECK_Y0 - 1.35, DECK_Y0 - 0.90),
    ]):
        z0 = deck_z0 - (i + 1) * 0.15
        z1 = z0 + 0.10
        b.box(f"degrau_deck_{i+1:02d}", "deck_wood",
              MAIN_X0 + 0.20, MAIN_X1 - 0.20,
              step_y0, step_y1,
              z0, z1)


def build_pool(b: ObjBuilder) -> None:
    """Small thermal pool (piscina termica) south of the deck."""
    coping_t = 0.20
    wall_t   = 0.15
    pool_top = Z_FLOOR - 0.25

    # Coping / borda
    b.box("borda_piscina_norte", "concrete",
          POOL_X0 - coping_t, POOL_X1 + coping_t,
          POOL_Y1, POOL_Y1 + coping_t,
          pool_top - 0.10, pool_top)
    b.box("borda_piscina_sul", "concrete",
          POOL_X0 - coping_t, POOL_X1 + coping_t,
          POOL_Y0 - coping_t, POOL_Y0,
          pool_top - 0.10, pool_top)
    b.box("borda_piscina_leste", "concrete",
          POOL_X1, POOL_X1 + coping_t,
          POOL_Y0, POOL_Y1,
          pool_top - 0.10, pool_top)
    b.box("borda_piscina_oeste", "concrete",
          POOL_X0 - coping_t, POOL_X0,
          POOL_Y0, POOL_Y1,
          pool_top - 0.10, pool_top)

    # Pool shell walls
    b.box("parede_piscina_norte", "pool_tile",
          POOL_X0, POOL_X1, POOL_Y1 - wall_t, POOL_Y1,
          pool_top - POOL_DEPTH, pool_top)
    b.box("parede_piscina_sul", "pool_tile",
          POOL_X0, POOL_X1, POOL_Y0, POOL_Y0 + wall_t,
          pool_top - POOL_DEPTH, pool_top)
    b.box("parede_piscina_leste", "pool_tile",
          POOL_X1 - wall_t, POOL_X1, POOL_Y0, POOL_Y1,
          pool_top - POOL_DEPTH, pool_top)
    b.box("parede_piscina_oeste", "pool_tile",
          POOL_X0, POOL_X0 + wall_t, POOL_Y0, POOL_Y1,
          pool_top - POOL_DEPTH, pool_top)

    # Floor
    b.box("fundo_piscina", "pool_tile",
          POOL_X0, POOL_X1, POOL_Y0, POOL_Y1,
          pool_top - POOL_DEPTH, pool_top - POOL_DEPTH + 0.10)

    # Water surface
    b.plane("agua_piscina", "water", [
        Vec3(POOL_X0 + wall_t, POOL_Y0 + wall_t, pool_top - 0.05),
        Vec3(POOL_X1 - wall_t, POOL_Y0 + wall_t, pool_top - 0.05),
        Vec3(POOL_X1 - wall_t, POOL_Y1 - wall_t, pool_top - 0.05),
        Vec3(POOL_X0 + wall_t, POOL_Y1 - wall_t, pool_top - 0.05),
    ])


# ---------------------------------------------------------------------------
# Furniture — ground floor
# ---------------------------------------------------------------------------

def build_furniture_ground(b: ObjBuilder) -> None:
    """Basic massing for furniture on the ground floor."""
    fz = Z_FLOOR + 0.05   # furniture sits on floor finish

    # --- Sala 1 (living room) — roughly X: 0.2–3.4, Y: 0.2–3.2 ---
    # Sofa (L-shape)
    b.box("sofa_principal", "furniture_fabric",
          0.50, 2.50, 0.50, 1.50, fz, fz + 0.85)
    b.box("sofa_lateral", "furniture_fabric",
          0.50, 1.50, 0.50, 2.00, fz, fz + 0.85)
    # Coffee table
    b.box("mesa_centro_sala1", "furniture_wood",
          0.90, 2.10, 1.60, 2.60, fz, fz + 0.45)
    # Armchair
    b.box("poltrona_sala1", "furniture_fabric",
          2.60, 3.30, 0.80, 1.60, fz, fz + 0.80)

    # Fireplace (inside brick tower, Sala 1 side)
    b.box("lareira", "brick",
          TOWER_X0 - 0.05, TOWER_X0 + 0.80,
          TOWER_Y0, TOWER_Y0 + 0.60,
          Z_FLOOR, Z_FLOOR + 1.20)

    # --- Sala 2 / TV room — X: 0.2–3.4, Y: 5.9–8.4 ---
    b.box("sofa_sala2", "furniture_fabric",
          0.50, 2.80, 6.10, 7.00, fz, fz + 0.85)
    b.box("mesa_tv", "furniture_wood",
          0.60, 2.70, 7.90, 8.20, fz, fz + 0.55)

    # --- Dining area (between sala 1 and tower) ---
    b.box("mesa_jantar", "furniture_wood",
          3.80, 6.50, 1.50, 3.50, fz, fz + 0.76)
    for ci, (cx, cy) in enumerate([
        (3.60, 1.70), (3.60, 2.80), (4.30, 1.20), (5.50, 1.20),
        (6.60, 1.70), (6.60, 2.80), (4.30, 3.70), (5.50, 3.70),
    ]):
        b.box(f"cadeira_jantar_{ci+1:02d}", "furniture_wood",
              cx - 0.22, cx + 0.22, cy - 0.22, cy + 0.22,
              fz, fz + 0.45)

    # --- Quarto (bedroom ground floor) — X: 3.65–7.25, Y: 0.2–5.8 ---
    # Bed (double)
    b.box("cama_quarto_terreo", "furniture_fabric",
          4.20, 7.00, 0.50, 2.70, fz, fz + 0.55)
    b.box("cabeceira_quarto", "furniture_wood",
          4.20, 7.00, 0.40, 0.55, fz, fz + 1.10)
    b.box("criado_esq", "furniture_wood",
          4.10, 4.60, 0.50, 1.00, fz, fz + 0.55)
    b.box("criado_dir", "furniture_wood",
          6.50, 7.00, 0.50, 1.00, fz, fz + 0.55)

    # --- BWC 01 (bathroom ground floor) — X: 0.2–TOWER_X0, Y: 3.35–5.8 ---
    b.box("vaso_bwc01", "wall_white",
          0.50, 0.95, 3.55, 4.00, fz, fz + 0.40)
    b.box("pia_bwc01", "wall_white",
          0.50, 1.30, 4.20, 4.70, fz, fz + 0.90)
    b.box("box_chuveiro_bwc01", "glass",
          1.40, 2.70, 3.55, 4.90, fz, fz + 2.10)

    # --- Cozinha (kitchen in annex) ---
    # L-shaped counter
    b.box("bancada_cozinha_sul", "kitchen_green",
          ANNEX_X0 + 0.55, ANNEX_X1 - 0.55,
          ANNEX_Y0 + 0.55, ANNEX_Y0 + 1.15,
          fz, fz + 0.90)
    b.box("bancada_cozinha_leste", "kitchen_green",
          ANNEX_X1 - 1.15, ANNEX_X1 - 0.55,
          ANNEX_Y0 + 0.55, 4.40,
          fz, fz + 0.90)
    # Island
    b.box("ilha_cozinha", "kitchen_green",
          ANNEX_X0 + 1.20, ANNEX_X0 + 3.20,
          ANNEX_Y0 + 1.60, ANNEX_Y0 + 2.70,
          fz, fz + 0.90)

    # --- Lavabo ---
    b.box("vaso_lavabo", "wall_white",
          ANNEX_X0 + 0.55, ANNEX_X0 + 1.00, 4.70, 5.15,
          fz, fz + 0.40)
    b.box("pia_lavabo", "stone_wall",
          ANNEX_X0 + 0.55, ANNEX_X0 + 1.80, 5.30, 5.70,
          fz, fz + 0.90)


# ---------------------------------------------------------------------------
# Furniture — mezzanine
# ---------------------------------------------------------------------------

def build_furniture_mezzanine(b: ObjBuilder) -> None:
    """Basic massing for mezzanine-level furniture."""
    fz = Z_MEZZ + 0.12 + 0.02   # on top of mezzanine slab finish

    # Bed (mezanino interno bedroom)
    b.box("cama_mezanino", "furniture_fabric",
          0.40, 2.60, 0.50, 2.50, fz, fz + 0.50)
    b.box("cabeceira_mezanino", "furniture_wood",
          0.40, 2.60, 0.40, 0.55, fz, fz + 0.90)

    # Desk / study area
    b.box("mesa_estudo", "furniture_wood",
          0.40, 1.80, 3.80, 4.60, fz, fz + 0.75)
    b.box("cadeira_estudo", "furniture_wood",
          0.55, 1.20, 5.00, 5.60, fz, fz + 0.45)

    # BWC 02 (upper bathroom)
    b.box("vaso_bwc02", "wall_white",
          0.40, 0.85, 0.50, 0.95, fz, fz + 0.40)
    b.box("pia_bwc02", "wall_white",
          0.40, 1.20, 1.20, 1.70, fz, fz + 0.90)
    b.box("box_chuveiro_bwc02", "glass",
          1.30, 2.60, 0.50, 1.80, fz, fz + 2.00)


# ---------------------------------------------------------------------------
# Context elements (trees, site perimeter)
# ---------------------------------------------------------------------------

def build_site_context(b: ObjBuilder) -> None:
    """Tree masses and surrounding site."""
    for idx, (tx, ty) in enumerate([
        (-6.0, -8.0), (-3.0, -10.0), (15.0, -8.0),
        (17.0,  3.0), (-8.0,  9.0),  (16.0, 14.0),
        ( 5.0, 20.0), (-5.0,  16.0),
    ], start=1):
        b.box(f"arvore_tronco_{idx:02d}", "structure_wood",
              tx, tx + 0.35, ty, ty + 0.35, Z_FLOOR, Z_FLOOR + 7.0)
        b.box(f"arvore_copa_{idx:02d}", "terrain_grass",
              tx - 1.8, tx + 2.2, ty - 1.8, ty + 2.2,
              Z_FLOOR + 5.5, Z_FLOOR + 10.0)


# ---------------------------------------------------------------------------
# Concrete pillars (structural A-frame legs / base)
# ---------------------------------------------------------------------------

def build_pillars(b: ObjBuilder) -> None:
    """Corner and intermediate concrete pillars at base of A-frame."""
    pw = PILLAR_W / 2.0
    # Positions along the main body edges
    pillar_positions = [
        (MAIN_X0, MAIN_Y0),
        (MAIN_X0, MAIN_Y1 / 2),
        (MAIN_X0, MAIN_Y1),
        (MAIN_X1, MAIN_Y0),
        (MAIN_X1, MAIN_Y1 / 2),
        (MAIN_X1, MAIN_Y1),
    ]
    for idx, (px, py) in enumerate(pillar_positions, start=1):
        b.box(f"pilar_{idx:02d}", "concrete",
              px - pw, px + pw, py - pw, py + pw,
              Z_FOUNDATION, Z_BARRILETE)


# ===========================================================================
# MTL writer
# ===========================================================================

MATERIALS: dict[str, tuple[float, float, float, float, float]] = {
    # name                  Kd (R, G, B)                  Ns      d (opacity)
    "roof_metal_dark":   (0.10, 0.11, 0.13,               50.0,   1.00),
    "structure_wood":    (0.38, 0.20, 0.12,               15.0,   1.00),
    "wood_light":        (0.82, 0.70, 0.52,               10.0,   1.00),
    "wood_dark_floor":   (0.28, 0.18, 0.10,               20.0,   1.00),
    "deck_wood":         (0.55, 0.38, 0.22,               12.0,   1.00),
    "brick":             (0.68, 0.40, 0.28,               10.0,   1.00),
    "wall_white":        (0.92, 0.90, 0.86,                8.0,   1.00),
    "glass":             (0.62, 0.80, 0.88,               80.0,   0.35),
    "frame_black":       (0.07, 0.08, 0.09,               60.0,   1.00),
    "water":             (0.28, 0.60, 0.76,               90.0,   0.60),
    "pool_tile":         (0.55, 0.75, 0.78,               40.0,   1.00),
    "terrain_grass":     (0.32, 0.48, 0.27,                5.0,   1.00),
    "concrete":          (0.64, 0.63, 0.60,               15.0,   1.00),
    "furniture_fabric":  (0.65, 0.58, 0.50,                5.0,   1.00),
    "furniture_wood":    (0.50, 0.34, 0.20,               12.0,   1.00),
    "kitchen_green":     (0.28, 0.48, 0.38,               30.0,   1.00),
    "stone_wall":        (0.60, 0.57, 0.52,               10.0,   1.00),
}


def write_mtl(path: Path) -> None:
    lines: list[str] = [
        "# Casa Maua — material library",
        "# generated by generate_model.py",
        "",
    ]
    for mat_name, (r, g, bv, ns, d) in MATERIALS.items():
        lines += [
            f"newmtl {mat_name}",
            f"Ka  0.100 0.100 0.100",
            f"Kd  {r:.3f} {g:.3f} {bv:.3f}",
            f"Ks  0.050 0.050 0.050",
            f"Ns  {ns:.1f}",
            f"d   {d:.2f}",
            f"illum 2",
            "",
        ]
    path.write_text("\n".join(lines), encoding="utf-8")


# ===========================================================================
# Main
# ===========================================================================

def main() -> None:
    b = ObjBuilder()

    print("Building terrain …")
    build_terrain(b)
    build_foundation(b)
    build_ground_floor_slab(b)

    print("Building A-frame roof …")
    build_aframe_roof(b)
    build_aframe_beams(b)

    print("Building facades …")
    build_front_facade(b)
    build_rear_facade(b)
    build_lateral_walls(b)

    print("Building annex …")
    build_annex(b)

    print("Building brick tower …")
    build_brick_tower(b)

    print("Building pillars …")
    build_pillars(b)

    print("Building interior partitions …")
    build_interior_walls_ground(b)

    print("Building mezzanine …")
    build_mezzanine(b)

    print("Building staircases …")
    build_internal_stair(b)
    build_external_stair(b)

    print("Building guardrails …")
    build_terrace_guardrails(b)

    print("Building deck and pool …")
    build_front_deck(b)
    build_pool(b)

    print("Building furniture …")
    build_furniture_ground(b)
    build_furniture_mezzanine(b)

    print("Building site context …")
    build_site_context(b)

    # Write files
    OBJ_PATH.parent.mkdir(parents=True, exist_ok=True)
    MTL_PATH.parent.mkdir(parents=True, exist_ok=True)

    print(f"Writing {OBJ_PATH} …")
    b.write(OBJ_PATH)

    print(f"Writing {MTL_PATH} …")
    write_mtl(MTL_PATH)

    print(f"\nDone.")
    print(f"  OBJ: {OBJ_PATH}  ({OBJ_PATH.stat().st_size // 1024} KB)")
    print(f"  MTL: {MTL_PATH}  ({MTL_PATH.stat().st_size // 1024} KB)")
    print(f"  Vertices: {len(b.vertices):,}")


if __name__ == "__main__":
    main()
