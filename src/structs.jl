mutable struct PgenVariant <: Variant
    index::UInt64 # 1-based
    offset::UInt64
    record_type::UInt8
    length::UInt64
end

struct Header{VTT,VLT,ACT,PRFT}
    # magic number (first two bytes): 0x6c 0x1b. 
    storage_mode::UInt # third byte. restrict to 0x10 for now.
    n_variants::UInt # 4th-7th byte. 
    n_samples::UInt # 8th-11th byte. 
    bits_per_variant_type::UInt # bits 0-3 of 12th byte
    bytes_per_record_length::UInt # bits 0-3 of 12th byte
    bytes_per_allele_count::UInt # bits 4-5 of 12th byte, restrict to 0 for now (no multiallelic variants allowed).
    bytes_per_sample_id::UInt # determined by n_samples (1 if < 2 ^ 8, etc.)
    provisional_reference::UInt # bits 6-7 of 12th byte. 
    n_blocks::UInt # number of blocks of 2^16 variants. Int(ceil(n_variants / 2 ^ 16)). 
    variant_block_offsets::Vector{UInt} # record starting points of #0, #65536, ... length of (8 * n_blocks) bytes.
    # The following appear in blocks of 2^16 variants.
    variant_types::VTT # Union{ScatteredBitsVector, ScatteredVector}
    variant_lengths::VLT # ScatteredVector
    allele_counts::ACT # Union{ScatteredVector, Nothing}
    provisional_reference_flags::PRFT # Union{ScatteredBitsVector, Nothing}
    most_recent_non_ld::Dict{UInt, PgenVariant}
end

struct Pgen{ST} <: GeneticData
    io::IOStream
    data::Union{Nothing, Vector{UInt8}}
    header::Header
    variant_record_cache::Union{Nothing, Vector{UInt8}} # used only with no_mmap
    genotypes_prev::Vector{UInt8} # for LD-compressed genotypes
    genotypes_cache::Vector{UInt8} # 0x00, 0x01, or 0x02. Byte-aligned for performance.
    genotypes_raw_cache::Vector{UInt8}
    dosage_cache::Vector{Float32} # Dosage values are represented by 16-bit numbers, Float32 is enough. 
    difflist_cache::Vector{ST} # length-64 vector for 64 Sample IDs.
    difflist_cache_incr::Vector{UInt32}
    psam_df::DataFrame
    pvar_df::DataFrame
end

"""
    Pgen(filename; no_mmap)

Creates an instance of `Pgen` from `filename`. `no_mmap` chooses whether to use `Mmap`.
"""
function Pgen(filename::String; no_mmap::Bool=false, 
    psam_filename=filename[1:end-5] * ".psam", 
    pvar_filename=filename[1:end-5] * ".pvar",
    psam_header_lines=1,
    pvar_header_lines=1)
    io = open(filename)
    if !no_mmap
        data = mmap(io)
    else
        data = nothing
    end
    header = Header(io)
    ST = bytes_to_UInt[header.bytes_per_sample_id]
    if !no_mmap
        variant_record_cache = nothing
    else
        variant_record_cache = Vector{UInt8}(undef, maximum(header.variant_lengths))
    end
    genotypes_prev = Vector{UInt8}(undef, header.n_samples)
    genotypes_cache = Vector{UInt8}(undef, header.n_samples)
    genotypes_raw_cache = Vector{UInt8}(undef, (header.n_samples + 3) >> 2) 
    dosage_cache = Vector{Float32}(undef, header.n_samples)
    difflist_cache = Vector{ST}(undef, 64)
    difflist_cache_incr = Vector{UInt32}(undef, 64)
    difflist_cache_incr[1] = 0
    Pgen{ST}(io, data, header, variant_record_cache, genotypes_prev, genotypes_cache, 
        genotypes_raw_cache,
        dosage_cache, difflist_cache, difflist_cache_incr,
        CSV.read(psam_filename, DataFrame; header=psam_header_lines), 
        CSV.read(pvar_filename, DataFrame; header=pvar_header_lines))
end

@inline n_variants(p::Pgen) = p.header.n_variants
@inline n_samples(p::Pgen) = p.header.n_samples
