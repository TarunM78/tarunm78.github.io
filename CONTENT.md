# Content manifest

Real content for the site. Read alongside SITE-SPEC.md. Nothing here is placeholder, so do not set `placeholder: true` on these files. Fields marked `TODO` are for the author to fill and should render as a visible red `TODO` marker in dev.

## Identity block

```
Tarun Malarvasan
Mechanical engineering, Penn State
Robotics and humanoids — actuators, mechanisms, perception
Currently in the Locomotion in Biology and Robotics Lab.
```

## Site hero

The home sheet shows the front of two indexes: SECTION A-A is the first sheet in the project
detail series that has a drawing on it, read from the collection rather than named, and
SECTION B-B is the leading role. Neither is hardcoded. A-A takes the first sheet with a
drawing rather than simply the lowest part number because the cover's whole argument is a
drawing over a sentence — a pending plate there would be the cover saying there is nothing
to see. With PN-002 drawn, the two are the same sheet.

Hero is **PN-002, the low-cost bimanual humanoid arm** (`src/assets/humanoidarm.png`), at
sheet 02-1.

The planetary humanoid actuator is no longer a project. It is the founder role at the stealth
startup (`src/content/experience/stealth-actuator.md`), which leads the experience list, so its
drawing now appears on the home sheet at SECTION B-B rather than A-A.

Part numbers were renumbered when PN-001 was added, so every existing project moved up one:
DIVA PN-002, SAAR PN-003, stents PN-004, humanoid arm PN-005. PN-001 is now retired rather than
reissued — a part number is not reused once the part leaves the set — so the series runs
PN-002 to PN-005.

Callouts, placed against the drawing — front view, both arms hanging, so the left arm carries
three of the four and the right shoulder carries the fourth:

```
- x: 0.74  y: 0.12   text: GIM8108-8, SHOULDER JOINT
- x: 0.26  y: 0.28   text: 200 mm UPPER LINK
- x: 0.25  y: 0.42   text: GIM6010-8 · 8:1 PLANETARY · 11 N·m
- x: 0.24  y: 0.74   text: SERVO GRIPPER, TWO-FINGER
```

The MKS XDRIVE controller is **not** a callout. It is carried off the arm and is not in this
view, and a leader line points at a component in the view. It is stated in the notes instead.
The earlier coordinates were authored before there was a drawing and did not survive it.

---

## Experience

`src/content/experience/`. Order is explicit (`order:` in frontmatter) rather than derived from
the dates, because roles overlap and the dates do not say which should lead.

1. **Founder** — Stealth startup, State College, PA. May 2026 – present. The planetary humanoid
   actuator, drawn but not named to an employer.
2. **Student researcher** — Penn State Locomotion in Biology and Robotics Lab, State College, PA. Aug 2026 – present.
3. **Student researcher** — Wharton People Lab, Philadelphia, PA. Oct 2025 – present.
3. **Growth intern** — Symbal, San Francisco, CA. Oct 2025 – present.
4. **Growth and media intern** — Code Four (YC X25), San Francisco, CA. Jun 2025 – Sep 2025.
5. **Student researcher** — Harvard Undergraduate OpenBio Laboratory, Cambridge, MA. Jun 2025 – Aug 2025. Related: PN-003.
6. **Student researcher** — Carnegie Mellon Biorobotics Laboratory, Pittsburgh, PA. Jun 2025 – Aug 2025.
7. **Student researcher** — Wyss Institute at Harvard University, Cambridge, MA. Jun 2024 – May 2025.
8. **Engineering intern** — Tormach, remote. Dec 2023 – Aug 2024.

One further role is **deliberately withheld** at the author's request. Do not add it from the
resume. The startup ships as **Stealth startup** — the work and the drawing are stated, the
company is not. Do not name it.

## Awards

`src/content/awards.json`, rendered as SECTION B-B of the About sheet. Ten entries, explicit
order, each pointing at the drawing it was given for rather than describing the work again.

TODO: the revision table (`revisions.json`) now overlaps this heavily — the three ISEF awards,
the Wyss and CMU work and the Wharton research all appear in both. Decide whether the revision
table becomes a short spine (school, lab, chair) with the awards carrying the rest, or goes.

TODO: the Columbia entry is titled "finalist" but the source note said "semi-finalist". Confirm
which, and fix whichever is wrong.

---

## Planetary humanoid actuator — the founder role

Not a project sheet. It lives at `src/content/experience/stealth-actuator.md` as the founder
role at the stealth startup, and carries no part number: a job is not a part. The drawing and
its callouts are kept here because the work itself has not changed.

**Role:** Founder, stealth startup, State College, PA
**Started:** May 2026, current

**Summary:**
A planetary actuator for humanoid joints, designed from the start to be metal 3D printed rather than machined.

**Drawing:** `src/assets/planetary-actuator.png` — exploded isometric line drawing, black on white. Rendered as `heroImageType: drawing`, which blends the white ground out onto the sheet.

**Callouts:**
```
- x: 0.13  y: 0.32   text: PRINTED HOUSING, RIBBED WEB
- x: 0.34  y: 0.42   text: STATOR STACK
- x: 0.57  y: 0.54   text: PLANET CARRIER
- x: 0.81  y: 0.62   text: OUTPUT FLANGE, SPOKED
```
These four were read off the exploded view rather than taken from a part list. TODO: confirm them against the CAD.

**Notes block:**
1. TODO: reduction ratio, continuous and peak torque, mass.
2. TODO: print process and alloy.
3. TODO: what the printed geometry buys over a machined equivalent.

---

## PN-002 · Humanoid arm

**Title:** Low-cost bimanual humanoid arm
**Year:** 2026
**Status:** active
**Attribution:** solo
**Link:** none yet

**Summary:**
A torso-mounted bimanual arm built for imitation-learning data collection, designed around the constraint that every joint stays backdrivable and each actuator stays cheap. Six degrees of freedom per arm plus a servo gripper, roughly 600mm reach, targeting a 1 to 2 kg payload. Four GIM6010-8 actuators handle the distal joints and two GIM8108-8 carry the shoulder, with integrated 8:1 planetary reduction rather than a higher gear ratio, since raising the ratio is the fast way to lose backdrivability. One arm gets built and working before parts are ordered for the second.

**Drawing:** `src/assets/humanoidarm.png` — front view of both arms on the post, black line on
white. Rendered as `heroImageType: drawing`, which blends the white ground out onto the sheet
and inverts it on the blueprint. Portrait, so it takes two frames of the contact sheet.

**Callouts:** see site hero above.

**Notes block:**
1. Each joint is driven by an MKS XDRIVE running field-oriented control, carried off the arm rather than at the joint.
2. Link lengths are 200mm shoulder to elbow, 100mm elbow to wrist, 200mm wrist to gripper.
3. Secondary encoders give absolute position at power-up, so there is no homing routine.
4. Data collection uses UMI with a T265 and an OAK-D Lite.
5. TODO: current build status.

---

## PN-003 · Auxetic stents

**Title:** Patient-specific auxetic stents
**Year:** TODO
**Status:** shipped
**Attribution:** solo, ISEF ENBM047
**Link:** https://isef.net/project/enbm047-patient-specific-optimization-using-auxetic-stents

**Summary:**
About a third of stent patients develop restenosis, and a large part of the cause is that conventional stents expand uniformly into vessels that are not uniform. This design uses an auxetic lattice, which widens laterally as it stretches, so the stent conforms to irregular vessel geometry and spreads radial force instead of concentrating it. A bi-stable mechanism holds both the contracted and expanded states, so the vessel cannot pull the stent back down. The expanded geometry is fitted per patient from MRI and CT angiography, reconstructed to CAD, with FEA used to check stress distribution under pulsatile flow.

**Hero image:** CAD render or FEA stress plot rather than a photo. This project is computational and a render is the honest artifact.

**Callouts:**
```
- text: AUXETIC UNIT CELL
- text: BI-STABLE STRUT, EXPANDED STATE
- text: VARIABLE RADIAL FORCE, STENOTIC REGION
- text: FEA STRESS DISTRIBUTION
```

**Notes block:**
1. Results are computational. No bench or animal testing.
2. TODO: which FEA package and what loading conditions.
3. TODO: what the next revision would change.

---

## PN-004 · DIVA

**Title:** DIVA, depth-intelligent navigation for the visually impaired
**Year:** TODO
**Status:** shipped
**Attribution:** team project, ISEF ENBM060T
**Link:** https://isef.net/project/enbm060t-depth-intelligent-navigation-for-visually-impaired

**Summary:**
A wearable navigation aid for blind and low-vision users, built to cost a few hundred dollars against surgical alternatives that run into the tens of thousands. It pairs a stereoscopic depth camera with an RGB camera and a convolutional network trained across eighty object classes, so it names what is ahead and how far away it is at the same time. Output reaches the user through audio on a button-driven interface, with a solenoid tactile channel alongside it.

**Callouts:**
```
- text: STEREOSCOPIC DEPTH CAMERA
- text: RGB CAMERA, OBJECT CLASSIFICATION
- text: SOLENOID TACTILE INTERFACE
- text: GYROSCOPE, ORIENTATION
```

**Notes block:**
1. Team project. TODO: state your specific contribution in one line.
2. Target unit cost of roughly $250 to $300.
3. TODO: what the next revision would change.

---

## PN-005 · SAAR

**Title:** SAAR, surgical navigation by projected augmented reality
**Year:** TODO
**Status:** shipped
**Attribution:** team project, ISEF ENBM051T
**Link:** https://isef.net/project/enbm051t-surgical-navigation-via-projector-based-ar-and-cv

**Summary:**
Surgical navigation systems generally put the anatomy on a screen across the room, which pulls the surgeon's eyes off the patient. SAAR projects the reconstruction directly onto the surgical site instead. Preoperative CT becomes a 3D model through a custom registration pipeline, a calibrated projector on a motorized frame keeps the overlay locked to the patient as they move, and a U-Net segments regions of interest so the projection can highlight them. A CNN-LSTM predicts thoracic organ movement so the overlay tracks breathing rather than lagging it.

**Callouts:**
```
- text: CALIBRATED PROJECTOR
- text: MOTORIZED ALIGNMENT FRAME
- text: REGISTRATION MARKERS
- text: PROJECTED SEGMENTATION OVERLAY
```

**Notes block:**
1. Team project. TODO: state your specific contribution in one line.
2. Validated against public CT and MRI datasets. TODO: alignment accuracy figure if you have it.
3. TODO: what the next revision would change.

---

## Revision table

Oldest first, drawing convention. Fill the TODO dates.

```
REV  DATE      DESCRIPTION                                          BY
A    TODO      Remote research internship, CMU BioRobotics Lab      TS
B    TODO      DIVA, ISEF grand award                               TS
C    TODO      SAAR, ISEF grand award                               TS
D    TODO      Tactile displays for the visually impaired, Wyss     TS
E    TODO      Auxetic stents, ISEF grand award                     TS
F    TODO      Research, Wharton                                    TS
G    2025      Robotics Chair, IEEE student chapter                 TS
H    2026      Locomotion in Biology and Robotics Lab, Penn State   TS
```

## Blog

Two entries to start. Suggested, since both are things you have live material for:

1. Why backdrivability beat gear ratio in the arm actuator selection.
2. What terrain testing an undulating robot with an overhead camera rig actually measures.
