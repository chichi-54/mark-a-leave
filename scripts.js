(function() {
    // ═══════════ GLOBAL STATE ═══════════
    const state = {
        currentPhase: 'phase-act1',
        subIndex: 0,
        emotionalTone: [],
        collectedFragments: [],
        storyComplete: false,
        searchUsed: false,
        isTransitioning: false,
        act3Stage: 'narrative1',
        act3LinesShown: 0,
        dm1Resolved: false,
        dm2Resolved: false,
        museumOpen: false,
    };

    // ── DOM REFS ──
    const mainContainer = document.getElementById('main-container');
    const fadeOverlay = document.getElementById('fade-overlay');
    const vignette = document.getElementById('vignette');
    const atmosphere = document.getElementById('atmosphere');
    const inkTexture = document.getElementById('ink-texture');
    const collectionToast = document.getElementById('collection-toast');
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');

    const phaseAct1 = document.getElementById('phase-act1');
    const phaseAct2 = document.getElementById('phase-act2');
    const phaseAct3 = document.getElementById('phase-act3');
    const phaseAct4 = document.getElementById('phase-act4');
    const phaseAct5 = document.getElementById('phase-act5');
    const phaseEpilogue = document.getElementById('phase-epilogue');
    const museumPhase = document.getElementById('museum-phase');
    const allStoryPhases = [phaseAct1, phaseAct2, phaseAct3, phaseAct4, phaseAct5, phaseEpilogue];

    const act1Lines = phaseAct1.querySelectorAll('.narrative-line');
    const hintAct1 = document.getElementById('hint-act1');
    const totalAct1Lines = 10;

    const act2Elements = phaseAct2.querySelectorAll('.narrative-line, .dialogue-line');
    const hintAct2 = document.getElementById('hint-act2');
    const totalAct2Elements = 13;

    const act3NarrativeLines = phaseAct3.querySelectorAll('.narrative-line');
    const hintAct3 = document.getElementById('hint-act3');
    const dm1Container = document.getElementById('dialogue-moment-1');
    const dm1LucLine = document.getElementById('dm1-luc-line');
    const dm1Choices = document.getElementById('dm1-choices');
    const dm1LucResponse = document.getElementById('dm1-luc-response');
    const dm2Container = document.getElementById('dialogue-moment-2');
    const dm2LucLine = document.getElementById('dm2-luc-line');
    const dm2Choices = document.getElementById('dm2-choices');
    const dm2LucResponse = document.getElementById('dm2-luc-response');

    const act4Elements = phaseAct4.querySelectorAll('.dialogue-line');
    const resolutionText = document.getElementById('resolution-text');
    const totalAct4Elements = 6;

    const contradictionText = document.getElementById('contradiction-text');
    const contradictionSub = document.getElementById('contradiction-sub');

    const searchLabel = document.getElementById('search-label');
    const searchWrapper = document.getElementById('search-wrapper');
    const searchInput = document.getElementById('search-input');
    const searchResult = document.getElementById('search-result');
    const syncLine = document.getElementById('sync-line');
    const museumLink = document.getElementById('museum-link');

    const museumGrid = document.getElementById('museum-grid');
    const artifactDetailOverlay = document.getElementById('artifact-detail-overlay');
    const detailEmoji = document.getElementById('detail-emoji');
    const detailTitle = document.getElementById('detail-title');
    const detailCreator = document.getElementById('detail-creator');
    const detailDescription = document.getElementById('detail-description');
    const closeDetailBtn = document.getElementById('close-detail');
    const returnFromMuseum = document.getElementById('return-from-museum');

    const allFragmentEls = document.querySelectorAll('.hidden-fragment');

// ── MUSIC ──
const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');
let musicPlaying = true;

// Set volume low so it's atmospheric, not distracting
bgMusic.volume = 0.12;

// Start music on first user interaction (required by browsers)
document.addEventListener('click', function startMusic() {
    if (bgMusic.paused) {
        bgMusic.play().catch((err) => {
            console.log('Music playback failed on first click. Will retry.', err);
        });
    }
}, { once: true });

// Also try on keypress (some users navigate with keyboard first)
document.addEventListener('keydown', function startMusicKey() {
    if (bgMusic.paused) {
        bgMusic.play().catch(() => {});
    }
}, { once: true });

// Keep music alive across page interactions
// Some browsers pause audio during certain events; this resumes it
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && musicPlaying && bgMusic.paused) {
        bgMusic.play().catch(() => {});
    }
});

// Toggle button
musicToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    if (musicPlaying) {
        bgMusic.pause();
        musicToggle.textContent = '♪ Music: Off';
        musicPlaying = false;
    } else {
        bgMusic.play().catch(() => {});
        musicToggle.textContent = '♪ Music: On';
        musicPlaying = true;
    }
});

    // ── FADE HELPERS ──
    async function fadeToBlack(duration = 900) {
        fadeOverlay.style.transition = `opacity ${duration}ms ease`;
        fadeOverlay.classList.add('active');
        return new Promise(r => setTimeout(r, duration));
    }
    async function fadeFromBlack(duration = 1100) {
        fadeOverlay.style.transition = `opacity ${duration}ms ease`;
        fadeOverlay.classList.remove('active');
        return new Promise(r => setTimeout(r, duration));
    }

    function deactivateStoryPhases() {
        allStoryPhases.forEach(p => { p.classList.remove('active'); p.classList.add('fading-out'); });
        setTimeout(() => allStoryPhases.forEach(p => p.classList.remove('fading-out')), 500);
    }

    function activatePhase(phaseEl) {
        deactivateStoryPhases();
        museumPhase.classList.remove('active');
        state.museumOpen = false;
        setTimeout(() => {
            phaseEl.classList.add('active');
            state.currentPhase = phaseEl.id;
        }, 120);
    }

    function setBackground(color, vignetteOp = 1, atmosphereOp = 0.3, inkOp = 0.04) {
        mainContainer.style.transition = 'background 2.2s ease';
        mainContainer.style.background = color;
        vignette.style.transition = 'opacity 2.2s ease';
        vignette.style.opacity = vignetteOp;
        atmosphere.style.transition = 'opacity 2.2s ease';
        atmosphere.style.opacity = atmosphereOp;
        inkTexture.style.transition = 'opacity 4s ease';
        inkTexture.style.opacity = inkOp;
    }

    // ── FRAGMENT SYSTEM ──
    function showFragmentElsForPhase(phaseId) {
        allFragmentEls.forEach(el => { el.style.display = 'none'; el.classList.remove('collected'); });
        const phaseMap = {
            'phase-act1': ['folded-letter'],
            'phase-act2': ['pressed-flower', 'moth'],
            'phase-act3': ['bird-feather', 'candle-stub', 'moth'],
            'phase-act4': ['candle-stub'],
        };
        const ids = phaseMap[phaseId] || [];
        ids.forEach(fid => {
            const el = document.querySelector(`.hidden-fragment[data-fragment="${fid}"]`);
            if (el && !state.collectedFragments.includes(fid)) {
                el.style.display = 'block';
                el.classList.remove('collected');
            }
        });
    }

    function collectFragment(fragmentName) {
        if (state.collectedFragments.includes(fragmentName)) return;
        state.collectedFragments.push(fragmentName);
        const el = document.querySelector(`.hidden-fragment[data-fragment="${fragmentName}"]`);
        if (el) { el.classList.add('collected'); setTimeout(() => { el.style.display = 'none'; }, 450); }
        const labels = {
            'folded-letter': 'Memory Fragment: A Folded Letter',
            'moth': 'Memory Fragment: Moth at the Window',
            'bird-feather': 'Memory Fragment: Bird Feather',
            'pressed-flower': 'Memory Fragment: Pressed Marsh Flower',
            'candle-stub': 'Memory Fragment: Candle Stub',
        };
        collectionToast.textContent = labels[fragmentName] || 'Memory Fragment Collected';
        collectionToast.classList.add('show');
        setTimeout(() => collectionToast.classList.remove('show'), 2200);
    }

    allFragmentEls.forEach(el => {
        el.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); collectFragment(this.dataset.fragment); });
        el.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); collectFragment(this.dataset.fragment); });
    });

    // ── ACT I ──
    function advanceAct1() {
        if (state.currentPhase !== 'phase-act1' || state.isTransitioning) return;
        if (state.subIndex < totalAct1Lines) {
            if (act1Lines[state.subIndex]) act1Lines[state.subIndex].classList.add('visible');
            state.subIndex++;
            if (state.subIndex >= totalAct1Lines) setTimeout(() => hintAct1.classList.add('show'), 500);
        } else if (state.subIndex >= totalAct1Lines) { transitionToAct2(); }
    }
    async function transitionToAct2() {
        state.isTransitioning = true;
        hintAct1.classList.remove('show');
        await fadeToBlack(900);
        setBackground('#05071c', 1, 0.28, 0.04);
        activatePhase(phaseAct2);
        state.subIndex = 0;
        act2Elements.forEach(el => el.classList.remove('visible'));
        hintAct2.classList.remove('show');
        showFragmentElsForPhase('phase-act2');
        await fadeFromBlack(1050);
        setTimeout(() => advanceAct2(), 450);
        state.isTransitioning = false;
    }

    // ── ACT II ──
    function advanceAct2() {
        if (state.currentPhase !== 'phase-act2' || state.isTransitioning) return;
        if (state.subIndex < totalAct2Elements) {
            if (act2Elements[state.subIndex]) act2Elements[state.subIndex].classList.add('visible');
            state.subIndex++;
            if (state.subIndex >= totalAct2Elements) setTimeout(() => hintAct2.classList.add('show'), 500);
        } else if (state.subIndex >= totalAct2Elements) { transitionToAct3(); }
    }
    async function transitionToAct3() {
        state.isTransitioning = true;
        hintAct2.classList.remove('show');
        await fadeToBlack(1000);
        setBackground('#070913', 1, 0.26, 0.05);
        activatePhase(phaseAct3);
        state.subIndex = 0;
        state.act3Stage = 'narrative1';
        state.act3LinesShown = 0;
        state.dm1Resolved = false;
        state.dm2Resolved = false;
        act3NarrativeLines.forEach(el => el.classList.remove('visible'));
        dm1Container.style.display = 'none'; dm1LucLine.classList.remove('visible'); dm1Choices.classList.remove('visible'); dm1LucResponse.style.display = 'none'; dm1LucResponse.classList.remove('visible');
        dm2Container.style.display = 'none'; dm2LucLine.classList.remove('visible'); dm2Choices.classList.remove('visible'); dm2LucResponse.style.display = 'none'; dm2LucResponse.classList.remove('visible');
        hintAct3.classList.remove('show');
        showFragmentElsForPhase('phase-act3');
        await fadeFromBlack(1100);
        setTimeout(() => advanceAct3(), 400);
        state.isTransitioning = false;
    }

    // ── ACT III ──
    function advanceAct3() {
        if (state.currentPhase !== 'phase-act3' || state.isTransitioning) return;
        const stage = state.act3Stage;
        if (stage === 'narrative1') {
            if (state.act3LinesShown < 7) { if (act3NarrativeLines[state.act3LinesShown]) act3NarrativeLines[state.act3LinesShown].classList.add('visible'); state.act3LinesShown++; }
            if (state.act3LinesShown >= 7) { state.act3Stage = 'dialogue1'; setTimeout(() => showDialogueMoment1(), 600); }
        } else if (stage === 'narrative2') {
            if (state.act3LinesShown < 10) { if (act3NarrativeLines[state.act3LinesShown]) act3NarrativeLines[state.act3LinesShown].classList.add('visible'); state.act3LinesShown++; }
            if (state.act3LinesShown >= 10) { state.act3Stage = 'dialogue2'; setTimeout(() => showDialogueMoment2(), 600); }
        } else if (stage === 'narrative3') {
            if (state.act3LinesShown < 13) { if (act3NarrativeLines[state.act3LinesShown]) act3NarrativeLines[state.act3LinesShown].classList.add('visible'); state.act3LinesShown++; }
            if (state.act3LinesShown >= 13) { setTimeout(() => hintAct3.classList.add('show'), 500); state.act3Stage = 'complete'; }
        } else if (stage === 'complete') { transitionToAct4(); }
    }

    function showDialogueMoment1() { dm1Container.style.display = 'flex'; setTimeout(() => dm1LucLine.classList.add('visible'), 200); setTimeout(() => dm1Choices.classList.add('visible'), 700); }
    function resolveDialogueMoment1(choice) {
        if (state.dm1Resolved) return;
        state.dm1Resolved = true; state.emotionalTone.push(choice);
        dm1Choices.classList.remove('visible'); dm1Choices.style.pointerEvents = 'none';
        let response = '';
        if (choice === 'resistance') { response = '&ldquo;You already chose this before I arrived. The cage was yours — I only opened the door.&rdquo;'; dm1LucResponse.className = 'dialogue-line luc luc-cold'; }
        else if (choice === 'reflection') { response = '&ldquo;Freedom and imprisonment can wear the same face. You are only now learning to tell them apart.&rdquo;'; dm1LucResponse.className = 'dialogue-line luc'; }
        else if (choice === 'surrender') { response = '&ldquo;Then you are finally honest with what you are becoming. That takes more courage than running ever did.&rdquo;'; dm1LucResponse.className = 'dialogue-line luc luc-intimate'; }
        dm1LucResponse.innerHTML = response; dm1LucResponse.style.display = 'block';
        setTimeout(() => dm1LucResponse.classList.add('visible'), 300);
        setTimeout(() => { dm1Container.style.display = 'none'; dm1LucLine.classList.remove('visible'); dm1LucResponse.classList.remove('visible'); dm1LucResponse.style.display = 'none'; dm1Choices.style.pointerEvents = 'auto'; state.act3Stage = 'narrative2'; state.act3LinesShown = 7; advanceAct3(); }, 2800);
    }

    function showDialogueMoment2() { dm2Container.style.display = 'flex'; setTimeout(() => dm2LucLine.classList.add('visible'), 200); setTimeout(() => dm2Choices.classList.add('visible'), 700); }
    function resolveDialogueMoment2(choice) {
        if (state.dm2Resolved) return;
        state.dm2Resolved = true; state.emotionalTone.push(choice);
        dm2Choices.classList.remove('visible'); dm2Choices.style.pointerEvents = 'none';
        let response = '';
        if (choice === 'resistance') { response = '&ldquo;No. But I witness you. And in this existence, that is the only currency that holds weight.&rdquo;'; dm2LucResponse.className = 'dialogue-line luc luc-cold'; }
        else if (choice === 'reflection') { response = '&ldquo;After enough time, the distinction blurs. But I have never looked away — and that is its own kind of truth.&rdquo;'; dm2LucResponse.className = 'dialogue-line luc'; }
        else if (choice === 'surrender') { response = '&ldquo;I have watched you for longer than any mortal span. If that is not love, then love is a poor word for what I feel.&rdquo;'; dm2LucResponse.className = 'dialogue-line luc luc-intimate'; }
        dm2LucResponse.innerHTML = response; dm2LucResponse.style.display = 'block';
        setTimeout(() => dm2LucResponse.classList.add('visible'), 300);
        setTimeout(() => { dm2Container.style.display = 'none'; dm2LucLine.classList.remove('visible'); dm2LucResponse.classList.remove('visible'); dm2LucResponse.style.display = 'none'; dm2Choices.style.pointerEvents = 'auto'; state.act3Stage = 'narrative3'; state.act3LinesShown = 10; advanceAct3(); }, 3000);
    }

    // ── ACT IV ──
    async function transitionToAct4() {
        state.isTransitioning = true;
        hintAct3.classList.remove('show');
        await fadeToBlack(1000);
        setBackground('#0d0a05', 0.85, 0.38, 0.05);
        activatePhase(phaseAct4);
        state.subIndex = 0;
        act4Elements.forEach(el => el.classList.remove('visible'));
        resolutionText.classList.remove('visible');
        showFragmentElsForPhase('phase-act4');
        await fadeFromBlack(1100);
        advanceAct4Auto();
        state.isTransitioning = false;
    }
    async function advanceAct4Auto() {
        for (let i = 0; i < totalAct4Elements; i++) {
            if (state.currentPhase !== 'phase-act4') return;
            await new Promise(r => setTimeout(r, 1450));
            if (act4Elements[i]) act4Elements[i].classList.add('visible');
        }
        await new Promise(r => setTimeout(r, 1800));
        if (state.currentPhase === 'phase-act4') {
            resolutionText.classList.add('visible');
            setTimeout(() => { if (state.currentPhase === 'phase-act4' && !state.isTransitioning) transitionToAct5(); }, 4000);
        }
    }

    // ── ACT V (FIXED: clinic background + dark text) ──
    async function transitionToAct5() {
        state.isTransitioning = true;
        resolutionText.classList.remove('visible');
        await fadeToBlack(1000);
        // Light parchment background, no vignette, no atmosphere, no ink texture
        setBackground('#eae7e1', 0, 0, 0);
        activatePhase(phaseAct5);
        contradictionText.classList.remove('visible');
        contradictionSub.classList.remove('visible');
        allFragmentEls.forEach(el => { el.style.display = 'none'; });
        await fadeFromBlack(900);
        setTimeout(() => contradictionText.classList.add('visible'), 400);
        setTimeout(() => contradictionSub.classList.add('visible'), 1400);
        setTimeout(() => { if (state.currentPhase === 'phase-act5' && !state.isTransitioning) transitionToEpilogue(); }, 4500);
        state.isTransitioning = false;
    }

    // ── EPILOGUE ──
    async function transitionToEpilogue() {
        state.isTransitioning = true;
        contradictionText.classList.remove('visible');
        contradictionSub.classList.remove('visible');
        await fadeToBlack(900);
        setBackground('#0b0b17', 1, 0.28, 0.03);
        activatePhase(phaseEpilogue);
        searchLabel.classList.remove('visible');
        searchWrapper.classList.remove('visible');
        searchResult.classList.remove('visible', 'no-result', 'found');
        searchResult.innerHTML = '';
        syncLine.classList.remove('visible');
        syncLine.textContent = '';
        museumLink.classList.remove('visible');
        searchInput.value = '';
        state.searchUsed = false;
        state.storyComplete = true;
        allFragmentEls.forEach(el => { el.style.display = 'none'; });
        await fadeFromBlack(1000);
        setTimeout(() => searchLabel.classList.add('visible'), 300);
        setTimeout(() => { searchWrapper.classList.add('visible'); searchInput.focus(); }, 900);
        state.isTransitioning = false;
    }

    function handleSearch(query) {
        if (!query || state.searchUsed) return;
        const trimmed = query.trim();
        const normalized = trimmed.replace(/\s+/g, ' ').toLowerCase();
        searchResult.classList.remove('visible', 'no-result', 'found');
        syncLine.classList.remove('visible');
        syncLine.textContent = '';
        museumLink.classList.remove('visible');
        setTimeout(() => {
            if (normalized === 'addie larue' || normalized === 'addie la rue') {
                const hasOpenness = state.emotionalTone.some(t => t === 'surrender' || t === 'reflection');
                const hasResistance = state.emotionalTone.some(t => t === 'resistance');
                if (hasOpenness || state.emotionalTone.length === 0) {
                    searchResult.className = 'search-result found';
                    searchResult.innerHTML = `<div class="result-card"><div class="result-name">Addie LaRue</div><div class="result-status">Status: Found · Exists in memory</div><div class="result-line">A record of her existence has been restored.</div></div>`;
                } else if (hasResistance && !hasOpenness) {
                    searchResult.className = 'search-result found';
                    searchResult.innerHTML = `<div class="result-card"><div class="result-name">Addie LaRue</div><div class="result-status">Status: Unstable · Partial match</div><div class="result-line">Entry recovered from memory archive — but the record wavers, as if uncertain of itself.</div></div>`;
                }
                searchResult.classList.add('visible');
                state.searchUsed = true;
                setTimeout(() => { syncLine.textContent = (hasOpenness || state.emotionalTone.length === 0) ? 'Memory synchronization complete.' : 'Memory synchronization incomplete.'; syncLine.classList.add('visible'); }, 1800);
                setTimeout(() => { museumLink.classList.add('visible'); }, 2600);
            } else if (trimmed.length > 0) {
                searchResult.className = 'search-result no-result';
                searchResult.textContent = 'No records match your search.';
                searchResult.classList.add('visible');
                setTimeout(() => museumLink.classList.add('visible'), 1500);
            } else {
                searchResult.className = 'search-result no-result';
                searchResult.textContent = 'Enter a name to search.';
                searchResult.classList.add('visible');
            }
        }, 350);
    }

    // ── MUSEUM ──
    function buildMuseumArtifacts() {
        const hasResistance = state.emotionalTone.some(t => t === 'resistance');
        const hasSurrender = state.emotionalTone.some(t => t === 'surrender');
        const hasReflection = state.emotionalTone.some(t => t === 'reflection');
        const hasOpenness = hasSurrender || hasReflection;
        const foundRecord = hasOpenness || state.emotionalTone.length === 0;
        const unstableRecord = hasResistance && !hasOpenness;

        const artifacts = [
            {
                id: 'wooden-ring', emoji: '🪵', name: 'The Wooden Ring', locked: false,
                creator: 'Carved from ash wood in Villon, 1691',
                description: `<strong>A simple band of ash wood that became a weight as heavy as three centuries.</strong> Carved by Addie's father when she was a child, it was worn on a leather cord as a talisman of home. After the deal with Luc, it became something else — a shackle, an unwelcome weight, a physical reminder of the soul she traded away.<br><br>She tried to discard it. She threw it from a Manhattan balcony. She buried it in the ruins of her New Orleans home. It always returned — slipped back into her pocket, looped around her wrist while she slept. Luc called it a gift. She called it a chain.<br><br><strong>It is the only physical mark of Villon she was never permitted to lose.</strong> Ash wood, darkened by three hundred years of unwilling touch.`
            },
            {
                id: 'fifth-bird', emoji: '🐦', name: 'The Fifth Bird (Revenir)', locked: !state.collectedFragments.includes('bird-feather'),
                creator: 'Originally carved wood; later recreated in marble by Arlo Miret',
                description: `<strong>One of five palm-sized wooden birds carved by her father.</strong> This one had a broken wing. Addie stole it when she fled Villon, and lost it in a Parisian death cart during the winter of 1716 — dropped among the bodies, forgotten in the grime of history.<br><br>But the idea of it survived.<br><br>Decades later, Addie found it recreated in marble as the sculpture <em>Revenir</em> — proof that she could leave marks on the world even when she herself was erased. The bird was her first successful mark: an idea that took root in another's mind.<br><br><strong>Once a splintered toy on a stable floor, this sculpture serves as the first material evidence of a life lived in the shadows of history.</strong>`
            },
            {
                id: 'freckles', emoji: '✨', name: 'The Seven Freckles', locked: false,
                creator: 'A private constellation, documented across three centuries of art',
                description: `<strong>A band of seven freckles across Addie's nose and cheeks.</strong> Estele, the old woman who taught her to pray to the dark gods, said they were signs — marks of the lives she would lead, placed by the gods who watched over her.<br><br>Across three hundred years, these seven points remained the only static feature of her face. In an 1806 pencil sketch, in a 2014 monochromatic painting, in every artistic rendering of the "ghost in the frame" — the freckles recur. They are the connective tissue that allows her to be identified across centuries.<br><br><strong>In every rendering, the face may blur or change, but these seven points remain — a map for those searching for the girl who cannot be found.</strong>`
            },
            {
                id: 'blue-notebook', emoji: '📘', name: 'The Blue Notebook', locked: !state.collectedFragments.includes('folded-letter'),
                creator: 'First of six volumes; written in Henry Strauss\'s hand, 2014',
                description: `<strong>Tight, slanting script on paper that refuses to fade.</strong> Pulled from a shelf in Henry's Brooklyn apartment in March 2014 — a blank notebook that became the first container of Addie's true story. Because the words were written in Henry's hand rather than her own, they were shielded from the curse.<br><br>This notebook is the first of six. It marks the moment Addie stopped being a ghost and began to direct the creation of her own legacy. Every page is proof that her name can be carried from mind to memory.<br><br><strong>Here, for the first time in three hundred years, the name "Addie LaRue" sits unmoving and real.</strong>`
            },
            {
                id: 'leather-jacket', emoji: '🧥', name: 'The Black Leather Jacket', locked: !state.collectedFragments.includes('moth'),
                creator: 'Taken from a shop window, New Orleans, 1970',
                description: `<strong>A piece of armor crafted from cowhide and memory.</strong> Stolen during the years Addie lived with Luc in New Orleans, this jacket became the one object she refused to leave behind. Unlike her body — which never aged, never scarred, never showed the passage of time — the jacket aged visibly. It cracked at the elbows. It softened at the collar. It wore thin at the cuffs.<br><br>Described as "broken in" and "worn practically to silk," it functioned as her Dorian Gray: the physical evidence of centuries of survival that her own skin could not display.<br><br><strong>Every crease and crack tells a story time was forbidden to leave on the woman who wore it.</strong>`
            },
            {
                id: 'onyx-watch', emoji: '⌚', name: 'The Onyx-Faced Watch', locked: false,
                creator: 'Found on Henry Strauss\'s bedside table, 2014',
                description: `<strong>An elegant analog weight with no minute hand.</strong> Gold numerals on an onyx ground, found resting on Henry's nightstand — the physical manifestation of his deal with Luc. One year of being "enough" in exchange for his soul.<br><br>When Addie first saw it, the hand rested near midnight. As their relationship deepened, the watch became a cuff around Henry's wrist — a relentless countdown to the moment Luc would return to collect.<br><br><strong>It ticks toward the end of a year that cost a soul to buy, and every second is borrowed.</strong>`
            },
            {
                id: 'odyssey', emoji: '📖', name: 'Battered Copy of The Odyssey', locked: false,
                creator: 'From The Last Word bookstore, New York, March 2014',
                description: `<strong>A worn paperback of an ancient journey, used not for the story inside but as a test.</strong> Addie attempted to steal this book from The Last Word on a rainy March afternoon. Henry caught her. And the next day, when she returned — he remembered.<br><br>"I remember you," he said. Three words that broke a three-hundred-year curse.<br><br>This battered Greek epic became the catalyst for the first time someone looked at Addie and saw not a stranger, but a woman who had been there the day before. It was never about the book. It was about whether anyone was finally looking back.<br><br><strong>A dog-eared paperback that asked the only question that mattered: Do you remember me?</strong>`
            },
            {
                id: 'sheet-music', emoji: '🎼', name: 'Sheet Music for "Dream Girl"', locked: false,
                creator: 'Signed by Toby Marsh, 2014',
                description: `<strong>Lyrics scribbled on receipts and napkins, capturing the melody of a woman the composer was terrified he would forget.</strong> Addie played the piano while Toby Marsh slept — a half-remembered tune, a dream-inspired melody. He woke and scribbled down what he could recall before it slipped away.<br><br>The song became "Dream Girl." It launched Toby's career. It proved that Addie's influence was bigger than her presence — that she could shape culture through the minds of others, existing as a trace, a mark of the absence of a presence.<br><br><strong>She was the ghost in the music, and the world sang her back into existence without ever knowing her name.</strong>`
            },
            {
                id: 'polaroids', emoji: '📷', name: 'The Polaroid Photographs', locked: false,
                creator: 'Taken by Henry Strauss, 2014; exhibited posthumously',
                description: `<strong>Six frames of chemical ghosts where the subject is always retreating.</strong> Henry tried repeatedly to capture Addie's image. Every attempt failed — the lens fogged, the focus blurred, the frame showed only empty space where she had stood. One final photo shows only a pair of feet next to a pile of books on a living room floor.<br><br>These photographs manifest the literal nature of Addie's curse: even a camera's lens is tampered with by the darkness, refusing to verify her existence. They capture not a face, but the precise, haunting shape of a woman being forgotten.<br><br>In the book's epilogue, they have been curated into a museum exhibit titled <em>"In Search of the Real Addie LaRue."</em> The failure to capture her likeness evolved into a celebrated artistic legacy — proof that even erasure can be witnessed.<br><br><strong>They capture not a face, but the ache of someone the world was designed to lose.</strong>`
            },
            {
                id: 'search-card', emoji: '📇', name: 'Search Record Card', locked: !state.searchUsed,
                creator: 'Generated by memory archive terminal',
                description: foundRecord ?
                    `<strong>Name: Addie LaRue<br>Status: Found · Exists in memory</strong><br><br>A record of her existence has been restored. The search returned a match — against all odds, against the architecture of the system itself. Somewhere in the depths of the archive, a fragment of her name survived.<br><br><strong>She is remembered.</strong> Not fully. Not permanently. But in this moment, in this record, she exists. The system acknowledges what the world once refused to hold.` :
                    unstableRecord ?
                    `<strong>Name: Addie LaRue<br>Status: Unstable · Partial match</strong><br><br>The search returned something — a flicker, a ghost of a record. The archive seems uncertain, as if it remembers and forgets simultaneously. The entry wavers when you look at it directly.<br><br><strong>She exists in the gap between acknowledgement and erasure.</strong>` :
                    `<strong>No record found for: Addie LaRue.</strong><br><br>The archive contains no entry matching this name. But absence is not the same as falsehood. She was here. This card, blank as it is, will serve as evidence that someone searched for her.`
            }
        ];
        return artifacts;
    }

    function renderMuseum() {
        const artifacts = buildMuseumArtifacts();
        museumGrid.innerHTML = '';
        artifacts.forEach(art => {
            const div = document.createElement('div');
            div.className = 'museum-artifact' + (art.locked ? ' locked' : '');
            div.innerHTML = `<span class="artifact-emoji">${art.emoji}</span><span class="artifact-name">${art.locked ? '???' : art.name}</span>`;
            if (!art.locked) {
                div.addEventListener('click', (e) => { e.stopPropagation(); showArtifactDetail(art); });
                div.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); showArtifactDetail(art); });
            }
            museumGrid.appendChild(div);
        });
    }

    function showArtifactDetail(artifact) {
        detailEmoji.textContent = artifact.emoji;
        detailTitle.textContent = artifact.name;
        detailCreator.textContent = artifact.creator;
        detailDescription.innerHTML = artifact.description;
        artifactDetailOverlay.classList.add('visible');
    }

    function hideArtifactDetail() { artifactDetailOverlay.classList.remove('visible'); }
    function openMuseum() {
    museumPhase.style.display = '';
    renderMuseum();
    museumPhase.classList.add('active');
    state.museumOpen = true;
    museumPhase.scrollTop = 0;
    }   
    function closeMuseum() {
    museumPhase.classList.remove('active');
    museumPhase.style.display = 'none';
    state.museumOpen = false;
    // Force a tiny delay then restore display for next open
    setTimeout(() => {
        museumPhase.style.display = '';
    }, 100);
    }
    // ── EVENT LISTENERS ──
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('button') || e.target.closest('input') || e.target.closest('.museum-artifact') || e.target.closest('#artifact-detail-overlay') || e.target.closest('.hidden-fragment') || e.target.closest('#museum-link') || e.target.closest('#return-from-museum')) return;
        if (state.museumOpen) return;
        if (state.currentPhase === 'phase-act1') advanceAct1();
        else if (state.currentPhase === 'phase-act2') advanceAct2();
        else if (state.currentPhase === 'phase-act3') advanceAct3();
    });

    document.addEventListener('keydown', function(e) {
        if (e.target === searchInput && e.key === 'Enter') { e.preventDefault(); handleSearch(searchInput.value); return; }
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (state.museumOpen) return;
            if (state.currentPhase === 'phase-act1') advanceAct1();
            else if (state.currentPhase === 'phase-act2') advanceAct2();
            else if (state.currentPhase === 'phase-act3') advanceAct3();
        }
    });

    dm1Choices.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); resolveDialogueMoment1(this.dataset.choice); });
        btn.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); resolveDialogueMoment1(this.dataset.choice); });
    });
    dm2Choices.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); resolveDialogueMoment2(this.dataset.choice); });
        btn.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); resolveDialogueMoment2(this.dataset.choice); });
    });

    searchInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleSearch(searchInput.value); } });
    searchInput.addEventListener('blur', function() { const val = searchInput.value.trim(); if (val && !state.searchUsed) { setTimeout(() => { if (!state.searchUsed && searchInput.value.trim() === val) handleSearch(val); }, 200); } });

    museumLink.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); openMuseum(); });
    museumLink.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); openMuseum(); });
    returnFromMuseum.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); closeMuseum(); });
    returnFromMuseum.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); closeMuseum(); });

    closeDetailBtn.addEventListener('click', function(e) { e.stopPropagation(); hideArtifactDetail(); });
    artifactDetailOverlay.addEventListener('click', function(e) { if (e.target === artifactDetailOverlay) hideArtifactDetail(); });

    // ── INIT ──
    async function init() {
        setBackground('#0e0b07', 1, 0.32, 0.05);
        activatePhase(phaseAct1);
        state.subIndex = 0;
        act1Lines.forEach(el => el.classList.remove('visible'));
        hintAct1.classList.remove('show');
        allFragmentEls.forEach(el => { el.style.display = 'none'; el.classList.remove('collected'); });
        showFragmentElsForPhase('phase-act1');
        await new Promise(r => setTimeout(r, 700));
        advanceAct1();
    }
    init();
})();